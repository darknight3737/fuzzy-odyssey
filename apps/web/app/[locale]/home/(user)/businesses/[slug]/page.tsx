import { Suspense } from 'react';

import { CompassPageLoader } from '~/components/compass-loader';

import { ManageBusinessPage } from './_components/manage-business';

export const metadata = {
  title: 'Gerenciar empresa | Selletive',
  robots: { index: false, follow: false },
};

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ onboarding?: string }>;
}) {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <ManageBusinessPage params={params} searchParams={searchParams} />
    </Suspense>
  );
}
