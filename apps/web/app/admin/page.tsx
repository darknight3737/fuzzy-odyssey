import Link from 'next/link';

import { AdminDashboard } from '@kit/admin/components/admin-dashboard';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

function AdminPage() {
  return (
    <>
      <PageHeader description={`Super Admin`} />

      <PageBody>
        <Link href="/admin/reviews" className="mb-6 inline-block underline">
          Moderar avaliações
        </Link>
        <Link
          href="/admin/contact-messages"
          className="mb-6 ml-6 inline-block underline"
        >
          Mensagens de contato
        </Link>
        <AdminDashboard />
      </PageBody>
    </>
  );
}

export default AdminGuard(AdminPage);
