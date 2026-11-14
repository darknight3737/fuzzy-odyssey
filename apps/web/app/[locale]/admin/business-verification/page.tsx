import { Suspense } from 'react';

import { connection } from 'next/server';

import { AdminGuard } from '@kit/admin/components/admin-guard';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { ReviewButtons } from './review-buttons';

async function Requests() {
  await connection();
  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin
    .from('business_verification_requests')
    .select('id,domain,account_id,business_id,draft,support_message,created_at')
    .eq('support_status', 'pending')
    .is('completed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at')
    .limit(100);
  if (error) throw new Error('Não foi possível carregar as solicitações.');
  return (
    <div className="space-y-4">
      {!data.length && <p>Nenhuma solicitação pendente.</p>}
      {data.map((request) => (
        <article className="space-y-3 rounded-xl border p-4" key={request.id}>
          <h2 className="font-semibold">
            {request.domain || 'Domínio indisponível'}
          </h2>
          <p className="text-sm">Conta: {request.account_id}</p>
          {request.business_id && (
            <p className="text-sm">Perfil: {request.business_id}</p>
          )}
          {!!request.draft && (
            <details>
              <summary>Dados do cadastro</summary>
              <pre className="text-xs break-all whitespace-pre-wrap">
                {JSON.stringify(request.draft, null, 2)}
              </pre>
            </details>
          )}
          <p className="break-words whitespace-pre-wrap">
            {request.support_message}
          </p>
          <ReviewButtons id={request.id} />
        </article>
      ))}
    </div>
  );
}

export default AdminGuard(function BusinessVerificationAdmin() {
  return (
    <main className="mx-auto max-w-4xl space-y-5 p-6">
      <h1 className="text-2xl font-semibold">Solicitações de vínculo</h1>
      <p>
        Confira a evidência antes de aprovar. A aprovação libera o perfil
        gratuito ou sua gestão.
      </p>
      <Suspense fallback={<p>Carregando solicitações…</p>}>
        <Requests />
      </Suspense>
    </main>
  );
});
