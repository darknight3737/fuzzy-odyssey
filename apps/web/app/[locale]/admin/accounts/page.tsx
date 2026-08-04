import { Suspense } from 'react';

import { ServerDataLoader } from '@makerkit/data-loader-supabase-nextjs';

import { AdminAccountsTable } from '@kit/admin/components/admin-accounts-table';
import { AdminCreateUserDialog } from '@kit/admin/components/admin-create-user-dialog';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Button } from '@kit/ui/button';
import { PageBody, PageHeader } from '@kit/ui/page';

import { Delayed, TableSkeleton } from '~/components/skeletons/page-skeletons';

interface SearchParams {
  page?: string;
  account_type?: 'all' | 'team' | 'personal';
  query?: string;
}

interface AdminAccountsPageProps {
  searchParams: Promise<SearchParams>;
}

export const metadata = {
  title: `Accounts`,
};

/**
 * The header and Create User action render immediately; only the table waits on
 * searchParams and the query behind them.
 */
function AccountsPage(props: AdminAccountsPageProps) {
  return (
    <PageBody>
      <PageHeader description={<AppBreadcrumbs />}>
        <div className="flex justify-end">
          <AdminCreateUserDialog>
            <Button data-test="admin-create-user-button">Create User</Button>
          </AdminCreateUserDialog>
        </div>
      </PageHeader>

      <Suspense
        fallback={
          <Delayed>
            <TableSkeleton />
          </Delayed>
        }
      >
        <AccountsTable searchParams={props.searchParams} />
      </Suspense>
    </PageBody>
  );
}

async function AccountsTable({
  searchParams: searchParamsPromise,
}: {
  searchParams: AdminAccountsPageProps['searchParams'];
}) {
  const client = getSupabaseServerClient();
  const searchParams = await searchParamsPromise;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  return (
    <ServerDataLoader
      table={'accounts'}
      client={client}
      page={page}
      where={(queryBuilder) => {
        const { account_type: type, query } = searchParams;

        if (type && type !== 'all') {
          queryBuilder.eq('is_personal_account', type === 'personal');
        }

        if (query) {
          queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
        }

        return queryBuilder;
      }}
    >
      {({ data, page, pageSize, pageCount }) => {
        return (
          <AdminAccountsTable
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            data={data}
            filters={{
              type: searchParams.account_type ?? 'all',
              query: searchParams.query ?? '',
            }}
          />
        );
      }}
    </ServerDataLoader>
  );
}

export default AdminGuard(AccountsPage);
