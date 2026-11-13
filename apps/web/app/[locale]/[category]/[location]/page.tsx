import { Suspense, cache } from 'react';

import { notFound, permanentRedirect } from 'next/navigation';
import { connection } from 'next/server';

import {
  DirectoryFilters,
  DirectoryPagination,
} from '~/components/directory-filters';
import { DirectoryResults } from '~/components/directory-results';
import { DirectoryHelpBand, DirectoryHero } from '~/components/directory-ui';
import { resolveCategoryFromSlug } from '~/lib/categories/server';
import { categoryLabel } from '~/lib/directory/category-label';
import {
  type DirectoryParams,
  directoryPage,
  filtersFromParams,
  searchMarketplace,
} from '~/lib/directory/marketplace';
import { taxonomyKind } from '~/lib/directory/taxonomy';
import { pageMetadata } from '~/lib/seo';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import {
  DirectoryGuide,
  DirectoryIntro,
  DirectoryLinkColumns,
} from '../../categories/[slug]/_components/category-sections';
import { LocationStructuredData } from './_components/location-structured-data';

type Props = {
  params: Promise<{ category: string; location: string }>;
  searchParams: Promise<DirectoryParams>;
};

const resolve = cache(async (slug: string, locationSlug: string) => {
  const [category, { data: location }] = await Promise.all([
    resolveCategoryFromSlug(slug),
    getDirectoryClient()
      .from('locations')
      .select('name,slug,type')
      .eq('slug', locationSlug)
      .maybeSingle(),
  ]);
  return { slug, category, location, locationSlug };
});

export async function generateMetadata({ params, searchParams }: Props) {
  await connection();
  const { category, location, locationSlug } = await params.then(
    ({ category, location }) => resolve(category, location),
  );
  if (!category || !location) return { robots: { index: false, follow: true } };
  const query = await searchParams;
  const index =
    !Object.values(query).some(Boolean) &&
    (
      await searchMarketplace({
        category: category.slug,
        kind: taxonomyKind(category.slug),
        location: locationSlug,
      })
    ).total > 0;
  return pageMetadata(
    `${categoryLabel(category.slug, category.name)} em ${location.name} | Selletive`,
    `Compare empresas de ${categoryLabel(category.slug, category.name)} em ${location.name}.`,
    `/${category.slug}/${locationSlug}`,
    index,
  );
}

async function Content({ params, searchParams }: Props) {
  await connection();
  const { slug, category, location, locationSlug } = await params.then(
    ({ category, location }) => resolve(category, location),
  );
  if (!category || !location) notFound();
  const query = await searchParams;
  if (slug !== category.slug) {
    const suffix = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (typeof value === 'string') suffix.set(key, value);
    permanentRedirect(
      `/${category.slug}/${locationSlug}${suffix.size ? '?' + suffix : ''}`,
    );
  }
  const page = directoryPage(query);
  const filters = {
    ...filtersFromParams(query),
    category: category.slug,
    kind: taxonomyKind(category.slug),
    location: locationSlug,
  };
  const [result, { data: nearby }] = await Promise.all([
    searchMarketplace(filters, page),
    getDirectoryClient()
      .from('directory_pages')
      .select('category_slug,location_slug,location_name,business_count')
      .eq('category_slug', category.slug)
      .neq('location_slug', locationSlug)
      .order('business_count', { ascending: false })
      .limit(20),
  ]);
  const label = categoryLabel(category.slug, category.name);
  const localizedCategory = { ...category, name: label };
  return (
    <main className="flex-1">
      {!Object.values(query).some(Boolean) && (
        <LocationStructuredData
          category={localizedCategory}
          location={location}
          businesses={result.items.map((item) => item.business)}
        />
      )}
      <DirectoryHero
        title={`Empresas de ${label} em ${location.name}`}
        subtitle="Qual é a ideal para a sua empresa? Compare projetos, avaliações e orçamentos."
      />
      <div className="mx-auto w-[min(100%-32px,1200px)] pb-20">
        <DirectoryFilters
          params={{ ...query, kind: taxonomyKind(category.slug) }}
          category={category.slug}
          location={locationSlug}
          options={{ categories: [], locations: [] }}
          total={result.total}
          breadcrumbs={[
            { label: 'Categorias', href: '/categories' },
            { label, href: `/categories/${category.slug}` },
            { label: location.name },
          ]}
          key={String(query.kind ?? '')}
        />
        <DirectoryIntro
          text={`Compare empresas de ${label} em ${location.name}. Veja projetos publicados, avaliações e faixas de orçamento. A localização indica a sede informada pela empresa; muitas também atendem remotamente.`}
        />
        <DirectoryResults
          items={result.items}
          title={`Todas as empresas de ${label} em ${location.name}`}
          featuredTitle={`Empresas de ${label} em destaque`}
          spotlight={page === 1 && (!query.sort || query.sort === 'relevance')}
        />
        <DirectoryPagination params={query} page={page} total={result.total} />
        <DirectoryHelpBand />
        <DirectoryLinkColumns
          columns={[
            {
              title: `${label} em outras localidades`,
              links: (nearby ?? []).map((item) => ({
                href: `/${item.category_slug}/${item.location_slug}`,
                label: `${item.location_name} (${item.business_count})`,
              })),
            },
            {
              title: 'Veja também',
              links: [
                {
                  href: `/categories/${category.slug}`,
                  label: `Todas as empresas de ${label}`,
                },
                { href: '/categories', label: 'Todas as categorias' },
              ],
            },
          ]}
        />
        <DirectoryGuide label={label} />
      </div>
    </main>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <div role="status" className="container min-h-96 p-12">
          Carregando…
        </div>
      }
    >
      <Content {...props} />
    </Suspense>
  );
}
