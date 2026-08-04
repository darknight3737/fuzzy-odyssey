import { Suspense, cache } from 'react';

import { connection } from 'next/server';

import { AdminAccountPage } from '@kit/admin/components/admin-account-page';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { CardSkeleton, Delayed } from '~/components/skeletons/page-skeletons';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export const generateMetadata = async (props: Params) => {
  const params = await props.params;
  const account = await loadAccount(params.id);

  return {
    title: `Admin | ${account.name}`,
  };
};

function AccountPage(props: Params) {
  return (
    <Suspense
      fallback={
        <Delayed>
          <CardSkeleton rows={4} />
        </Delayed>
      }
    >
      <AccountDetails params={props.params} />
    </Suspense>
  );
}

async function AccountDetails({ params }: Params) {
  const account = await loadAccount((await params).id);

  return <AdminAccountPage account={account} />;
}

export default AdminGuard(AccountPage);

const loadAccount = cache(accountLoader);

async function accountLoader(id: string) {
  await connection();

  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('accounts')
    .select('*, memberships: accounts_memberships (*)')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
