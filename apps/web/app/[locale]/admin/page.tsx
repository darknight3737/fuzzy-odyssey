import { Suspense } from 'react';

import { AdminDashboard } from '@kit/admin/components/admin-dashboard';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

import {
  DashboardSkeleton,
  Delayed,
} from '~/components/skeletons/page-skeletons';

function AdminPage() {
  return (
    <PageBody>
      <PageHeader description={`Super Admin`} />

      <Suspense
        fallback={
          <Delayed>
            <DashboardSkeleton />
          </Delayed>
        }
      >
        <AdminDashboard />
      </Suspense>
    </PageBody>
  );
}

export default AdminGuard(AdminPage);
