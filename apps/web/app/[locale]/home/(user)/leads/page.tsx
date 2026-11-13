import { Suspense } from 'react';

import { AdminHeader } from '~/components/admin-ui';
import { CompassPageLoader } from '~/components/compass-loader';

import { Inbox } from './_components/inbox';

export const metadata = {
  title: 'Pedidos e oportunidades | Selletive',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 lg:py-10">
      <AdminHeader
        eyebrow="Seu espaço na Selletive"
        title="Pedidos e oportunidades"
        description="Acompanhe seus pedidos e converse com empresas em um só lugar."
      />
      <Suspense fallback={<CompassPageLoader />}>
        <Inbox />
      </Suspense>
    </main>
  );
}
