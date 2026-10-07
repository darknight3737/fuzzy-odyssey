import 'server-only';
import { cacheLife } from 'next/cache';

import { createCmsClient } from '@kit/cms';
import { getLogger } from '@kit/shared/logger';

import { paginate } from '../../../_lib/server/pagination';
import { CHANGELOG_ENTRIES_PER_PAGE } from '../changelog-page-path';

async function loadChangelogEntries(
  language: string | undefined,
  page: number,
) {
  'use cache';
  cacheLife('hours');

  const client = await createCmsClient();
  const logger = await getLogger();

  try {
    return await client.getContentItems({
      collection: 'changelog',
      limit: CHANGELOG_ENTRIES_PER_PAGE,
      offset: (page - 1) * CHANGELOG_ENTRIES_PER_PAGE,
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

export async function loadChangelogPage(
  language: string | undefined,
  page: number,
) {
  return paginate(
    await loadChangelogEntries(language, page),
    page,
    CHANGELOG_ENTRIES_PER_PAGE,
  );
}

export async function getChangelogPageCount(language: string | undefined) {
  const { total } = await loadChangelogEntries(language, 1);

  return Math.max(1, Math.ceil(total / CHANGELOG_ENTRIES_PER_PAGE));
}
