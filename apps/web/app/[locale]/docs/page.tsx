import { Suspense } from 'react';

import { locale as localeRootParam } from 'next/root-params';

import { getTranslations } from 'next-intl/server';

import { SitePageHeader } from '../(marketing)/_components/site-page-header';
import { DocsCards } from './_components/docs-cards';
import { getDocs } from './_lib/server/docs.loader';

export const generateMetadata = async () => {
  const t = await getTranslations('marketing');

  return {
    title: t('documentation'),
  };
};

function DocsPage() {
  return (
    <div className={'flex w-full flex-1 flex-col gap-y-6 xl:gap-y-8'}>
      <Suspense fallback={null}>
        <DocsPageHeader />
      </Suspense>

      <div className={'relative flex size-full justify-center overflow-y-auto'}>
        <Suspense fallback={null}>
          <DocsCardsList />
        </Suspense>
      </div>
    </div>
  );
}

async function DocsPageHeader() {
  const t = await getTranslations('marketing');

  return (
    <SitePageHeader
      title={t('documentation')}
      subtitle={t('documentationSubtitle')}
    />
  );
}

async function DocsCardsList() {
  const items = await getDocs(await localeRootParam());

  // Filter out any docs that have a parentId, as these are children of other docs
  const cards = items.filter((item) => !item.parentId);

  return (
    <div className="container">
      <div className={'flex flex-1 flex-col'}>
        <DocsCards cards={cards} />
      </div>
    </div>
  );
}

export default DocsPage;
