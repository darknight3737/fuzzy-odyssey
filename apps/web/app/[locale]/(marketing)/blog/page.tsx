import { Suspense, cache } from 'react';

import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';

import { createCmsClient } from '@kit/cms';
import { getLogger } from '@kit/shared/logger';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

// local imports
import { SitePageHeader } from '../_components/site-page-header';
import { BlogPagination } from './_components/blog-pagination';
import { PostPreview } from './_components/post-preview';

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

const BLOG_POSTS_PER_PAGE = 10;

export const generateMetadata = async (
  props: BlogPageProps,
): Promise<Metadata> => {
  const t = await getTranslations('marketing');
  const resolvedLanguage = await getLocale();
  const searchParams = await props.searchParams;
  const limit = BLOG_POSTS_PER_PAGE;

  const page = searchParams.page ? parseInt(searchParams.page) : 0;
  const offset = page * limit;

  const { total } = await getContentItems(resolvedLanguage, limit, offset);

  return {
    title: t('blog'),
    description: t('blogSubtitle'),
    pagination: {
      previous: page > 0 ? `/blog?page=${page - 1}` : undefined,
      next: offset + limit < total ? `/blog?page=${page + 1}` : undefined,
    },
  };
};

const getContentItems = cache(
  async (language: string | undefined, limit: number, offset: number) => {
    const client = await createCmsClient();
    const logger = await getLogger();

    try {
      return await client.getContentItems({
        collection: 'posts',
        limit,
        offset,
        language,
        content: false,
        sortBy: 'publishedAt',
        sortDirection: 'desc',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to load blog posts');

      return { total: 0, items: [] };
    }
  },
);

function BlogPage(props: BlogPageProps) {
  return (
    <>
      <Suspense fallback={null}>
        <BlogHeader />
      </Suspense>

      <div className={'container flex flex-col space-y-6 py-8'}>
        <Suspense fallback={null}>
          <BlogPosts searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}

export default BlogPage;

async function BlogHeader() {
  const t = await getTranslations('marketing');

  return <SitePageHeader title={t('blog')} subtitle={t('blogSubtitle')} />;
}

async function BlogPosts({
  searchParams,
}: {
  searchParams: BlogPageProps['searchParams'];
}) {
  const language = await getLocale();
  const { page: pageParam } = await searchParams;

  const limit = BLOG_POSTS_PER_PAGE;
  const page = pageParam ? parseInt(pageParam) : 0;
  const offset = page * limit;

  const { total, items: posts } = await getContentItems(
    language,
    limit,
    offset,
  );

  return (
    <>
      <If
        condition={posts.length > 0}
        fallback={<Trans i18nKey="marketing.noPosts" />}
      >
        <PostsGridList>
          {posts.map((post, idx) => {
            return <PostPreview key={idx} post={post} />;
          })}
        </PostsGridList>

        <div>
          <BlogPagination
            currentPage={page}
            canGoToNextPage={offset + limit < total}
            canGoToPreviousPage={page > 0}
          />
        </div>
      </If>
    </>
  );
}

function PostsGridList({ children }: React.PropsWithChildren) {
  return (
    <div className="grid grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-x-2 md:gap-y-12 lg:grid-cols-3">
      {children}
    </div>
  );
}
