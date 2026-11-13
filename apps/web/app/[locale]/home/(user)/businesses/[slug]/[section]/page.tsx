import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { CompassPageLoader } from '~/components/compass-loader';

import { ManageBusinessPage } from '../_components/manage-business';

export const metadata = {
  title: 'Gerenciar perfil | Selletive',
  robots: { index: false, follow: false },
};

async function Section({
  params,
}: {
  params: Promise<{ slug: string; section: string }>;
}) {
  const { section } = await params;

  switch (section) {
    case 'editar':
    case 'avaliacoes':
    case 'desempenho':
    case 'oportunidades':
    case 'selos':
      return <ManageBusinessPage params={params} section={section} />;
    default:
      notFound();
  }
}

export default function Page(props: Parameters<typeof Section>[0]) {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <Section {...props} />
    </Suspense>
  );
}
