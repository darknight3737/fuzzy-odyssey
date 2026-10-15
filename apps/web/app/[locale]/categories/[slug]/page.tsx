import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { getAllLocationsForFilter } from '~/lib/locations/search';
import { pageMetadata } from '~/lib/seo';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import { BusinessGridWrapper } from './_components/business-grid-wrapper';
import { FilterBar } from './_components/category-filters/filter-bar';
import { CategoryHeader } from './_components/category-header';
import { getCategoryBySlug } from './_lib/server/get-category';
import {
  getFilteredBusinesses,
  getUnfilteredCategoryBusinesses,
} from './_lib/server/get-filtered-businesses';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    location?: string;
    minRating?: string;
    languages?: string;
    teamSize?: string;
    worksRemotely?: string;
    foundedYear?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;

  // Use cached category fetch to avoid duplicate query
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: 'Category Not Found' };

  const filters = await searchParams;
  const hasFilters = Object.keys(filters).length > 0;
  const hasCompanies =
    !hasFilters &&
    (await getUnfilteredCategoryBusinesses(category.id)).length > 0;
  return pageMetadata(
    `${category.name} — Compare empresas | Selletive`,
    category.description?.slice(0, 160) ||
      `Encontre empresas de ${category.name}. Compare especialidades, localização e avaliações na Selletive.`,
    `/categories/${category.slug}`,
    hasCompanies,
  );
}

async function CategoryPage({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const filters = await searchParams;
  // Fetch category and locations in parallel
  // Locations include both DB entries and common suggestions for better UX
  const [category, locations] = await Promise.all([
    getCategoryBySlug(slug),
    getAllLocationsForFilter(),
  ]);

  if (!category) {
    notFound();
  }

  // Parse filter parameters
  const languages = filters.languages
    ? filters.languages.split(',')
    : undefined;

  const businesses =
    Object.keys(filters).length === 0
      ? await getUnfilteredCategoryBusinesses(category.id)
      : await getFilteredBusinesses({
          categoryId: category.id,
          location: filters.location,
          minRating: filters.minRating ? Number(filters.minRating) : undefined,
          languages,
          teamSize: filters.teamSize,
          worksRemotely: filters.worksRemotely === 'true' ? true : undefined,
          foundedYear: filters.foundedYear,
          sort:
            (filters.sort as 'relevancy' | 'rating' | 'name') || 'relevancy',
        });

  const { data: directoryPages } = await getDirectoryClient()
    .from('directory_pages')
    .select('category_slug, location_slug, location_name, business_count')
    .eq('category_slug', category.slug)
    .order('business_count', { ascending: false })
    .limit(30);

  return (
    <div className={'container mx-auto py-8'}>
      <CategoryHeader category={category} />
      <FilterBar
        businessCount={businesses.length}
        locations={locations}
        currentSort={filters.sort || 'relevancy'}
      />
      <BusinessGridWrapper businesses={businesses} />
      {!!directoryPages?.length && (
        <section className="mt-16 border-t pt-10">
          <h2 className="mb-6 font-serif text-2xl">
            {category.name} por localização
          </h2>
          <div className="flex flex-wrap gap-3">
            {directoryPages.map((page) => (
              <Link
                key={page.location_slug}
                href={`/${page.category_slug}/${page.location_slug}`}
                className="hover:bg-muted rounded-full border px-4 py-2 text-sm"
              >
                {page.location_name} ({page.business_count})
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <div role="status" className="container mx-auto min-h-96 px-6 py-12">
          Carregando…
        </div>
      }
    >
      <CategoryPage {...props} />
    </Suspense>
  );
}
