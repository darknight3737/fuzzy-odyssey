import { Suspense } from 'react';

import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';

import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { ContentFallback } from '~/components/skeletons/page-skeletons';

import { SitePageHeader } from '../../_components/site-page-header';
import { getChangelogPagePath } from '../_lib/changelog-page-path';
import { loadChangelogPage } from '../_lib/server/load-changelog-entries';
import { ChangelogEntry } from './changelog-entry';
import { ChangelogPagination } from './changelog-pagination';

export async function getChangelogListMetadata(
  page: number,
): Promise<Metadata> {
  const t = await getTranslations('marketing');
  const language = await getLocale();
  const { hasPreviousPage, hasNextPage } = await loadChangelogPage(
    language,
    page,
  );

  return {
    title: t('changelog'),
    description: t('changelogSubtitle'),
    pagination: {
      previous: hasPreviousPage ? getChangelogPagePath(page - 1) : undefined,
      next: hasNextPage ? getChangelogPagePath(page + 1) : undefined,
    },
  };
}

export function ChangelogListPage(props: { page: Promise<number> }) {
  return (
    <>
      <Suspense fallback={null}>
        <ChangelogHeader />
      </Suspense>

      <div className="container flex max-w-4xl flex-col space-y-12 py-12">
        <Suspense fallback={<ContentFallback />}>
          <ChangelogEntries page={props.page} />
        </Suspense>
      </div>
    </>
  );
}

async function ChangelogHeader() {
  const t = await getTranslations('marketing');

  return (
    <SitePageHeader title={t('changelog')} subtitle={t('changelogSubtitle')} />
  );
}

async function ChangelogEntries(props: { page: Promise<number> }) {
  const [language, page] = await Promise.all([getLocale(), props.page]);
  const {
    items: entries,
    hasPreviousPage,
    hasNextPage,
  } = await loadChangelogPage(language, page);

  return (
    <If
      condition={entries.length > 0}
      fallback={<Trans i18nKey="marketing.noChangelogEntries" />}
    >
      <div className="space-y-0">
        {entries.map((entry, index) => {
          return (
            <ChangelogEntry
              key={entry.id}
              entry={entry}
              highlight={index === 0}
            />
          );
        })}
      </div>

      <ChangelogPagination
        currentPage={page}
        canGoToNextPage={hasNextPage}
        canGoToPreviousPage={hasPreviousPage}
      />
    </If>
  );
}
