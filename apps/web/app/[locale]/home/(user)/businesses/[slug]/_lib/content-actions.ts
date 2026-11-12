'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  ContentSchema,
  DeleteContentSchema,
} from '~/lib/business/content-schema';

const tables = {
  service: 'business_services',
  case: 'business_cases',
  award: 'business_awards',
} as const;

export const saveContentAction = authActionClient
  .inputSchema(ContentSchema)
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const { data: owner } = await client
      .from('businesses')
      .select('id')
      .eq('id', input.businessId)
      .eq('account_id', user.id)
      .maybeSingle();
    if (!owner) throw new Error('Empresa não encontrada.');
    const common = { title: input.title, description: input.description };
    let error;
    if (input.kind === 'service') {
      const values = { ...common, price_range: input.detail || null };
      const result = input.id
        ? await client
            .from('business_services')
            .update(values)
            .eq('id', input.id)
            .eq('business_id', input.businessId)
        : await client
            .from('business_services')
            .insert({ ...values, business_id: input.businessId });
      error = result.error;
    } else if (input.kind === 'case') {
      const values = {
        ...common,
        client_name: input.detail || null,
        challenge: input.challenge || null,
        solution: input.solution || null,
        results: input.results || null,
        industry: input.industry || null,
        project_type: input.project_type || null,
        duration: input.duration || null,
        budget_range: input.budget_range || null,
        images: input.images
          .split(',')
          .map((url) => url.trim())
          .filter(Boolean),
      };
      const result = input.id
        ? await client
            .from('business_cases')
            .update(values)
            .eq('id', input.id)
            .eq('business_id', input.businessId)
        : await client
            .from('business_cases')
            .insert({ ...values, business_id: input.businessId });
      error = result.error;
    } else {
      const values = { ...common, issuer: input.detail };
      const result = input.id
        ? await client
            .from('business_awards')
            .update(values)
            .eq('id', input.id)
            .eq('business_id', input.businessId)
        : await client
            .from('business_awards')
            .insert({ ...values, business_id: input.businessId });
      error = result.error;
    }
    if (error)
      throw new Error(
        'Não foi possível salvar este conteúdo. Confira os limites do seu plano.',
      );
    revalidatePath(`/company/${input.slug}`);
    revalidatePath(`/home/businesses/${input.slug}`);
    return { success: true };
  });

export const deleteContentAction = authActionClient
  .inputSchema(DeleteContentSchema)
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const { data: owner } = await client
      .from('businesses')
      .select('id')
      .eq('id', input.businessId)
      .eq('account_id', user.id)
      .maybeSingle();
    if (!owner) throw new Error('Empresa não encontrada.');
    const { error } = await client
      .from(tables[input.kind])
      .delete()
      .eq('id', input.id)
      .eq('business_id', input.businessId);
    if (error) throw new Error('Não foi possível excluir.');
    revalidatePath(`/company/${input.slug}`);
    revalidatePath(`/home/businesses/${input.slug}`);
    return { success: true };
  });
