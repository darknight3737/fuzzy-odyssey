'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import * as z from 'zod';

import { isSuperAdmin } from '@kit/admin';
import { renderOtpEmail } from '@kit/email-templates';
import { getMailer } from '@kit/mailers';
import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { checkBadge, checkDns } from './checks';
import { corporateEmail, proofCommand, verificationDomain } from './schema';

import { createHmac, randomInt } from 'node:crypto';

function digest(id: string, code: string) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Verificação por e-mail indisponível.');
  return createHmac('sha256', secret).update(`${id}:${code}`).digest('hex');
}

export const startBusinessVerification = authActionClient
  .inputSchema(z.object({ slug: z.string().regex(/^[a-z0-9-]{1,160}$/) }))
  .action(async ({ parsedInput: { slug }, ctx: { user } }) => {
    const admin = getSupabaseServerAdminClient();
    const { data: business } = await admin
      .from('businesses')
      .select('id,account_id,website,tier,verification_status')
      .eq('slug', slug)
      .maybeSingle();
    if (
      !business ||
      user.is_anonymous ||
      (business.account_id !== user.id &&
        (business.account_id !== null || business.tier !== 'unclaimed')) ||
      business.verification_status === 'verified'
    ) {
      return { error: 'Este perfil não está disponível para confirmação.' };
    }
    const domain = verificationDomain(business.website) ?? '';
    const { data: request, error } = await admin
      .from('business_verification_requests')
      .insert({ account_id: user.id, business_id: business.id, domain })
      .select('id')
      .single();
    if (error) return { error: 'Não foi possível iniciar a confirmação.' };
    redirect(`/home/verification/${request.id}`);
  });

export const verifyBusiness = authActionClient
  .inputSchema(z.object({ id: z.uuid(), proof: proofCommand }))
  .action(async ({ parsedInput: { id, proof }, ctx: { user } }) => {
    const admin = getSupabaseServerAdminClient();
    const { data: request } = await admin
      .from('business_verification_requests')
      .select(
        'id,domain,token,expires_at,completed_at,business_id,support_status',
      )
      .eq('id', id)
      .eq('account_id', user.id)
      .maybeSingle();
    if (
      !request ||
      request.completed_at ||
      Date.parse(request.expires_at) <= Date.now()
    ) {
      return { error: 'Esta confirmação expirou ou já foi concluída.' };
    }
    if (
      request.business_id &&
      proof.method !== 'badge' &&
      proof.method !== 'support'
    ) {
      const { data: target } = await admin
        .from('businesses')
        .select('account_id')
        .eq('id', request.business_id)
        .maybeSingle();
      if (!target || target.account_id !== null)
        return { error: 'Para ativar o Verificado, use o selo.' };
    }

    if (proof.method === 'support') {
      const { data, error } = await admin
        .from('business_verification_requests')
        .update({ support_message: proof.message, support_status: 'pending' })
        .eq('id', id)
        .eq('account_id', user.id)
        .is('completed_at', null)
        .or('support_status.is.null,support_status.eq.rejected')
        .select('id')
        .maybeSingle();
      return error || !data
        ? {
            error: 'Já há um pedido em análise ou a confirmação foi encerrada.',
          }
        : { status: 'support' };
    }
    if (!request.domain)
      return {
        error:
          'Este perfil precisa de ajuda da equipe para confirmar o vínculo.',
      };

    if (proof.method === 'send_email') {
      const email = proof.email.toLowerCase();
      if (!corporateEmail(email, request.domain))
        return { error: `Use um endereço @${request.domain}.` };
      const from = process.env.EMAIL_SENDER;
      if (!from || !process.env.SUPABASE_SECRET_KEY)
        return {
          error:
            'O envio de códigos está indisponível. Use outra opção ou fale com o suporte.',
        };
      const code = String(randomInt(0, 1000000)).padStart(6, '0');
      const { data: reserved } = await admin.rpc(
        'reserve_business_verification_email',
        {
          p_request: id,
          p_actor: user.id,
          p_recipient: email,
          p_digest: digest(id, code),
        },
      );
      if (!reserved)
        return { error: 'Aguarde antes de solicitar outro código.' };
      try {
        const { html, subject } = await renderOtpEmail({
          otp: code,
          productName: 'Selletive',
          language: 'pt',
        });
        await (await getMailer()).sendEmail({ from, to: email, html, subject });
      } catch {
        return {
          error:
            'Não conseguimos enviar o código agora. Tente novamente ou use outra opção.',
        };
      }
      return { status: 'sent' };
    }

    try {
      if (
        proof.method === 'badge' &&
        !(await checkBadge(proof.page, request.domain, request.token))
      ) {
        return {
          error:
            'Não encontramos o selo com seu link nessa página. Confira o endereço e o código publicado.',
        };
      }
      if (
        proof.method === 'dns' &&
        !(await checkDns(request.domain, request.token))
      ) {
        return {
          error:
            'O registro TXT ainda não foi encontrado. Confira o valor ou aguarde a propagação.',
        };
      }
    } catch {
      return {
        error: 'A consulta está indisponível. Tente novamente em instantes.',
      };
    }
    if (
      proof.method === 'account_email' &&
      !corporateEmail(user.email, request.domain)
    ) {
      return {
        error:
          'O e-mail da conta não corresponde ao domínio. Solicite um código para um e-mail corporativo.',
      };
    }

    const { data: slug, error } = await admin.rpc(
      'complete_business_verification',
      {
        p_request: id,
        p_actor: user.id,
        p_method: proof.method,
        ...(proof.method === 'email'
          ? { p_digest: digest(id, proof.code) }
          : {}),
      },
    );
    if (error?.code === 'SL002')
      return {
        error:
          'Já existe um perfil correspondente. Procure o perfil no diretório para reivindicá-lo.',
      };
    if (!slug)
      return {
        error:
          proof.method === 'email'
            ? 'Código inválido, expirado ou com limite de tentativas atingido.'
            : 'Não foi possível confirmar o vínculo. Confira os dados ou peça ajuda à equipe.',
      };
    updateTag('directory');
    revalidatePath('/home');
    redirect(
      `/home/businesses/${slug}?onboarding=${request.business_id ? 'claimed' : 'published'}`,
    );
  });

export const reviewBusinessVerification = authActionClient
  .inputSchema(z.object({ id: z.uuid(), approve: z.boolean() }))
  .action(async ({ parsedInput: { id, approve } }) => {
    if (!(await isSuperAdmin(getSupabaseServerClient())))
      throw new Error('Acesso restrito.');
    const admin = getSupabaseServerAdminClient();
    const { data: request } = await admin
      .from('business_verification_requests')
      .select('account_id')
      .eq('id', id)
      .eq('support_status', 'pending')
      .is('completed_at', null)
      .maybeSingle();
    if (!request) return { error: 'Pedido não está mais em análise.' };
    if (approve) {
      const { data } = await admin.rpc('complete_business_verification', {
        p_request: id,
        p_actor: request.account_id,
        p_method: 'support',
      });
      if (!data)
        return {
          error:
            'Não foi possível aprovar. Confira se o perfil já existe, mudou de domínio ou foi reivindicado.',
        };
      updateTag('directory');
    } else {
      const { data } = await admin
        .from('business_verification_requests')
        .update({ support_status: 'rejected' })
        .eq('id', id)
        .eq('support_status', 'pending')
        .is('completed_at', null)
        .select('id')
        .maybeSingle();
      if (!data) return { error: 'Não foi possível recusar este pedido.' };
    }
    revalidatePath('/admin/business-verification');
    return { status: 'reviewed' };
  });
