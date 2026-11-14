import { Suspense } from 'react';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import * as z from 'zod';

import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { corporateEmail } from '~/lib/business-verification/schema';

import { VerificationForm } from './verification-form';

export const metadata = {
  title: 'Confirmar vínculo | Selletive',
  robots: { index: false },
};

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const auth = await requireUser(getSupabaseServerClient(), {
    next: `/home/verification/${id}`,
  });
  if (!auth.data) redirect(auth.redirectTo);
  const admin = getSupabaseServerAdminClient();
  const { data: request } = await admin
    .from('business_verification_requests')
    .select(
      'id,domain,token,business_id,expires_at,support_status,completed_at,result_slug,email_expires_at',
    )
    .eq('account_id', auth.data.id)
    .eq('id', id)
    .maybeSingle();
  if (!request) notFound();
  if (request.completed_at && request.result_slug)
    redirect(`/home/businesses/${request.result_slug}`);
  if (Date.parse(request.expires_at) <= Date.now()) {
    return (
      <p>
        Esta confirmação expirou.{' '}
        <Link className="underline" href="/home">
          Voltar ao painel
        </Link>
      </p>
    );
  }

  let owned = false;
  if (request.business_id) {
    const { data } = await admin
      .from('businesses')
      .select('account_id')
      .eq('id', request.business_id)
      .maybeSingle();
    owned = data?.account_id === auth.data.id;
  }

  return (
    <VerificationForm
      id={request.id}
      domain={request.domain}
      token={request.token}
      canUseAccount={corporateEmail(auth.data.email, request.domain)}
      supportStatus={request.support_status}
      owned={owned}
      initialCodeSent={
        !!request.email_expires_at &&
        Date.parse(request.email_expires_at) > Date.now()
      }
    />
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-5 sm:p-8">
      <h1 className="text-3xl font-semibold">
        Confirme seu vínculo com a empresa
      </h1>
      <Suspense fallback={<p>Carregando opções…</p>}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}
