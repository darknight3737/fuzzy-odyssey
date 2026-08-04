import { Suspense } from 'react';

import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';

import { getLocale, getTranslations } from 'next-intl/server';

import { createCmsClient } from '@kit/cms';
import { getLogger } from '@kit/shared/logger';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { ContentFallback } from '~/components/skeletons/page-skeletons';

import { SitePageHeader } from '../_components/site-page-header';
import { ChangelogEntry } from './_components/changelog-entry';
import { ChangelogPagination } from './_components/changelog-pagination';

interface ChangelogPageProps {
  searchParams: Promise<{ page?: string }>;
}

const CHANGELOG_ENTRIES_PER_PAGE = 50;

export const generateMetadata = async (
  props: ChangelogPageProps,
): Promise<Metadata> => {
  const t = await getTranslations('marketing');
  const resolvedLanguage = await getLocale();
  const searchParams = await props.searchParams;
  const limit = CHANGELOG_ENTRIES_PER_PAGE;

  const page = searchParams.page ? parseInt(searchParams.page) : 0;
  const offset = page * limit;

  const { total } = await getContentItems(resolvedLanguage, limit, offset);

  return {
    title: t('changelog'),
    description: t('changelogSubtitle'),
    pagination: {
      previous: page > 0 ? `/changelog?page=${page - 1}` : undefined,
      next: offset + limit < total ? `/changelog?page=${page + 1}` : undefined,
    },
  };
};

async function getContentItems(
  language: string | undefined,
  limit: number,
  offset: number,
) {
  'use cache';
  cacheLife('hours');

  const client = await createCmsClient();
  const logger = await getLogger();

  try {
    return await client.getContentItems({
      collection: 'changelog',
      limit,
      offset,
      content: false,
      language,
      sortBy: 'publishedAt',
      sortDirection: 'desc',
    });
  } catch (error) {
    logger.error({ error }, 'Failed to load changelog entries');

    return { total: 0, items: [] };
  }
}

function ChangelogPage(props: ChangelogPageProps) {
  return (
    <>
      <Suspense fallback={null}>
        <ChangelogHeader />
      </Suspense>

      <div className="container flex max-w-4xl flex-col space-y-12 py-12">
        <Suspense fallback={<ContentFallback />}>
          <ChangelogEntries searchParams={props.searchParams} />
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

async function ChangelogEntries({
  searchParams,
}: {
  searchParams: ChangelogPageProps['searchParams'];
}) {
  const language = await getLocale();
  const { page: pageParam } = await searchParams;

  const limit = CHANGELOG_ENTRIES_PER_PAGE;
  const page = pageParam ? parseInt(pageParam) : 0;
  const offset = page * limit;

  const { total, items: entries } = await getContentItems(
    language,
    limit,
    offset,
  );

  return (
    <>
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
          canGoToNextPage={offset + limit < total}
          canGoToPreviousPage={page > 0}
        />
      </If>
    </>
  );
}

export default ChangelogPage;
