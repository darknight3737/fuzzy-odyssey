import { Suspense } from 'react';

import { CompassPageLoader } from '~/components/compass-loader';

import { ManageBusinessPage } from './_components/manage-business';

export const metadata = {
  title: 'Gerenciar empresa | Selletive',
  robots: { index: false, follow: false },
};

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <ManageBusinessPage params={params} />
    </Suspense>
  );
}
