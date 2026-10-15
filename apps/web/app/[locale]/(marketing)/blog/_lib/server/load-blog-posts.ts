import 'server-only';
import { cacheLife } from 'next/cache';

import { createCmsClient } from '@kit/cms';
import { getLogger } from '@kit/shared/logger';

import { paginate } from '../../../_lib/server/pagination';
import { BLOG_POSTS_PER_PAGE } from '../blog-page-path';

async function loadBlogPosts(language: string | undefined, page: number) {
  'use cache';
  cacheLife('hours');

  const client = await createCmsClient();
  const logger = await getLogger();

  try {
    return await client.getContentItems({
      collection: 'posts',
      limit: BLOG_POSTS_PER_PAGE,
      offset: (page - 1) * BLOG_POSTS_PER_PAGE,
      language,
      content: false,
      sortBy: 'publishedAt',
      sortDirection: 'desc',
    });
  } catch (error) {
    logger.error({ error }, 'Failed to load blog posts');

    return { total: 0, items: [] };
  }
}

export async function loadBlogPage(language: string | undefined, page: number) {
  return paginate(
    await loadBlogPosts(language, page),
    page,
    BLOG_POSTS_PER_PAGE,
  );
}

export async function getBlogPageCount(language: string | undefined) {
  const { total } = await loadBlogPosts(language, 1);

  return Math.max(1, Math.ceil(total / BLOG_POSTS_PER_PAGE));
}
