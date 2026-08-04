import { Suspense } from 'react';

import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { notFound } from 'next/navigation';

import { createCmsClient } from '@kit/cms';

import { ContentFallback } from '~/components/skeletons/page-skeletons';

import { Post } from '../../blog/_components/post';

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * No React `cache()` wrapper: `use cache` already dedupes, and across requests
 * rather than just within one. Combining them throws at build time.
 */
async function getPostBySlug(slug: string) {
  'use cache';
  cacheLife('hours');

  const client = await createCmsClient();

  return client.getContentItemBySlug({ slug, collection: 'posts' });
}

/**
 * Must return at least one param under Cache Components. Slugs not returned are
 * still served — Next renders the shell and upgrades it in the background.
 */
export async function generateStaticParams() {
  'use cache';
  cacheLife('hours');

  const client = await createCmsClient();
  const { items } = await client.getContentItems({
    collection: 'posts',
    content: false,
  });

  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const slug = (await params).slug;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { title, publishedAt, description, image } = post;

  return Promise.resolve({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: publishedAt,
      url: post.url,
      images: image
        ? [
            {
              url: image,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  });
}

function BlogPost({ params }: BlogPageProps) {
  return (
    <Suspense fallback={<ContentFallback />}>
      <BlogPostContent params={params} />
    </Suspense>
  );
}

export default BlogPost;

async function BlogPostContent({ params }: BlogPageProps) {
  const slug = (await params).slug;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className={'container sm:max-w-none sm:p-0'}>
      <Post post={post} content={post.content} />
    </div>
  );
}
