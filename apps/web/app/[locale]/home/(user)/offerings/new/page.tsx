import { Suspense } from 'react';

import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { OfferingForm } from './_components/offering-form';
export const metadata = {
  title: 'Cadastrar serviço ou software B2B | Selletive',
  robots: { index: false, follow: false },
};
async function FormContent() {
  await connection();
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/auth/sign-in?next=/home/offerings/new');
  const [categories, vendors] = await Promise.all([
    client
      .from('categories')
      .select('id,name')
      .eq('is_active', true)
      .order('name')
      .limit(500),
    client
      .from('businesses')
      .select('id,name')
      .eq('account_id', user.id)
      .order('name')
      .limit(100),
  ]);
  if (categories.error || vendors.error)
    throw categories.error ?? vendors.error;
  return (
    <OfferingForm
      categories={categories.data ?? []}
      vendors={vendors.data ?? []}
    />
  );
}
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-3 text-3xl font-semibold">Cadastre sua solução B2B.</h1>
      <p className="mb-8">
        Cada software tem seu próprio perfil. Uma empresa pode apresentar
        produtos e serviços separados.
      </p>
      <Suspense fallback={<p>Carregando cadastro…</p>}>
        <FormContent />
      </Suspense>
    </main>
  );
}
