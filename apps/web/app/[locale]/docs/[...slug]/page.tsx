import { Suspense } from 'react';

import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { notFound } from 'next/navigation';

import { ContentRenderer, createCmsClient } from '@kit/cms';
import { cn } from '@kit/ui/utils';

import { ContentFallback } from '~/components/skeletons/page-skeletons';

interface DocumentationPageProps {
  params: Promise<{ slug: string[] }>;
}

async function getPageBySlug(slug: string) {
  'use cache';
  cacheLife('hours');

  const client = await createCmsClient();

  return client.getContentItemBySlug({ slug, collection: 'documentation' });
}

export async function generateStaticParams() {
  'use cache';
  cacheLife('hours');

  const client = await createCmsClient();
  const { items } = await client.getContentItems({
    collection: 'documentation',
    content: false,
  });

  return items.map((item) => ({ slug: item.slug.split('/') }));
}

export async function generateMetadata({
  params,
}: DocumentationPageProps): Promise<Metadata> {
  const slug = (await params).slug.join('/');
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const { title, description } = page;

  return {
    title,
    description,
  };
}

function DocumentationPage({ params }: DocumentationPageProps) {
  return (
    <Suspense fallback={<ContentFallback />}>
      <DocumentationContent params={params} />
    </Suspense>
  );
}

async function DocumentationContent({ params }: DocumentationPageProps) {
  const slug = (await params).slug.join('/');
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const description = page?.description ?? '';

  return (
    <div className={'container flex flex-1 flex-col gap-y-4'}>
      <div className={'flex flex-1'}>
        <div className="relative mx-auto max-w-3xl flex-1 flex-col overflow-x-hidden">
          <article
            className={cn('mx-auto h-full w-full flex-1 gap-y-12 pt-4 pb-36')}
          >
            <section className={'mt-4 flex flex-col gap-y-1 pb-4'}>
              <h1
                className={
                  'text-foreground text-3xl font-semibold tracking-tighter'
                }
              >
                {page.title}
              </h1>

              <h2 className={'text-secondary-foreground/80 text-lg'}>
                {description}
              </h2>
            </section>

            <div className={'markdoc'}>
              <ContentRenderer content={page.content} />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default DocumentationPage;
