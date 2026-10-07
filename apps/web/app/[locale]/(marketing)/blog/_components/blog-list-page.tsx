import { Suspense } from 'react';

import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';

import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { ContentFallback } from '~/components/skeletons/page-skeletons';

import { SitePageHeader } from '../../_components/site-page-header';
import { getBlogPagePath } from '../_lib/blog-page-path';
import { loadBlogPage } from '../_lib/server/load-blog-posts';
import { BlogPagination } from './blog-pagination';
import { PostPreview } from './post-preview';

export async function getBlogListMetadata(page: number): Promise<Metadata> {
  const t = await getTranslations('marketing');
  const language = await getLocale();
  const { hasPreviousPage, hasNextPage } = await loadBlogPage(language, page);

  return {
    title: t('blog'),
    description: t('blogSubtitle'),
    pagination: {
      previous: hasPreviousPage ? getBlogPagePath(page - 1) : undefined,
      next: hasNextPage ? getBlogPagePath(page + 1) : undefined,
    },
  };
}

export function BlogListPage(props: { page: Promise<number> }) {
  return (
    <>
      <Suspense fallback={null}>
        <BlogHeader />
      </Suspense>

      <div className={'container flex flex-col space-y-6 py-8'}>
        <Suspense fallback={<ContentFallback />}>
          <BlogPosts page={props.page} />
        </Suspense>
      </div>
    </>
  );
}

async function BlogHeader() {
  const t = await getTranslations('marketing');

  return <SitePageHeader title={t('blog')} subtitle={t('blogSubtitle')} />;
}

async function BlogPosts(props: { page: Promise<number> }) {
  const [language, page] = await Promise.all([getLocale(), props.page]);
  const {
    items: posts,
    hasPreviousPage,
    hasNextPage,
  } = await loadBlogPage(language, page);

  return (
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
          canGoToNextPage={hasNextPage}
          canGoToPreviousPage={hasPreviousPage}
        />
      </div>
    </If>
  );
}

function PostsGridList({ children }: React.PropsWithChildren) {
  return (
    <div className="grid grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-x-2 md:gap-y-12 lg:grid-cols-3">
      {children}
    </div>
  );
}
