import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { withI18n } from '~/lib/i18n/with-i18n';

import { getAllLocationsForFilter } from '~/lib/locations/search';

import { CategoryHeader } from './_components/category-header';
import { BusinessGridWrapper } from './_components/business-grid-wrapper';
import { FilterBar } from './_components/category-filters/filter-bar';
import { getCategoryBySlug } from './_lib/server/get-category';
import { getFilteredBusinesses } from './_lib/server/get-filtered-businesses';

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

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  
  // Use cached category fetch to avoid duplicate query
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} - Selletive`,
    description: category.description,
  };
}

async function CategoryPage({ params, searchParams }: Props) {
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

  const businesses = await getFilteredBusinesses({
    categoryId: category.id,
    location: filters.location,
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    languages,
    teamSize: filters.teamSize,
    worksRemotely:
      filters.worksRemotely === 'true' ? true : undefined,
    foundedYear: filters.foundedYear,
    sort: (filters.sort as 'relevancy' | 'rating' | 'name') || 'relevancy',
  });

  return (
    <div className={'container mx-auto py-8'}>
      <CategoryHeader category={category} />
      <FilterBar
        businessCount={businesses.length}
        locations={locations}
        currentSort={filters.sort || 'relevancy'}
      />
      <BusinessGridWrapper businesses={businesses} />
    </div>
  );
}

export default withI18n(CategoryPage);

