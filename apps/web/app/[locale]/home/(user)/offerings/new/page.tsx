import { Suspense } from 'react';

import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { AdminHeader } from '~/components/admin-ui';

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
      .select('id,name,slug')
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
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 lg:py-10">
      <AdminHeader
        back={{ href: '/home', label: 'Minhas empresas' }}
        eyebrow="Novo perfil"
        title="Cadastre sua solução B2B"
        description="Escolha se é um serviço (agência, consultoria) ou um software. Cada software tem seu próprio perfil; uma empresa pode apresentar produtos e serviços separados."
      />
      <div className="rounded-2xl border border-[#dce5e1] bg-white p-6 md:p-8">
        <Suspense fallback={<p>Carregando cadastro…</p>}>
          <FormContent />
        </Suspense>
      </div>
    </main>
  );
}
