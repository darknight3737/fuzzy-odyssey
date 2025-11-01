import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import appConfig from '~/config/app.config';
import { withI18n } from '~/lib/i18n/with-i18n';
import { resolveCategoryFromSlug } from '~/lib/categories/server';
import { parseLocationSlug } from '~/lib/locations/utils';
import { getBusinessesByLocationSlug } from '~/lib/locations/server';

import { BusinessGrid } from '../../categories/[slug]/_components/business-grid';
import { LocationHeader } from './_components/location-header';
import { LocationBreadcrumbs } from './_components/location-breadcrumbs';
import { LocationStructuredData } from './_components/location-structured-data';

type Props = {
  params: Promise<{ category: string; location: string }>;
};

// ISR: Revalidate every hour per PRD requirement
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug, location: locationSlug } = await params;

  // Resolve category (could be alias) - per PRD requirement
  const category = await resolveCategoryFromSlug(categorySlug);

  if (!category) {
    return { title: 'Not Found' };
  }

  // Parse location slug to get display name (works even if location not in DB)
  let locationName: string;
  try {
    const parsed = parseLocationSlug(locationSlug);
    locationName = parsed.name;
  } catch {
    // Fallback: try to get from DB, or use slug as display name
    const client = getSupabaseServerClient();
    const { data: location } = await client
      .from('locations')
      .select('name')
      .eq('slug', locationSlug)
      .single();

    locationName = location?.name || locationSlug;
  }

  const title = `Best ${category.name} in ${locationName}`;
  const description = `Find top ${category.name} providers in ${locationName}. Verified reviews, ratings, and contact information.`;
  const canonicalUrl = `${appConfig.url}/${categorySlug}/${locationSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

async function CategoryLocationPage({ params }: Props) {
  const { category: categorySlug, location: locationSlug } = await params;

  // Validate location slug format
  let parsedLocation;
  try {
    parsedLocation = parseLocationSlug(locationSlug);
  } catch {
    // Invalid slug format - return 404
    notFound();
  }

  // Resolve category from slug or alias - per PRD requirement
  const category = await resolveCategoryFromSlug(categorySlug);

  if (!category) notFound();

  // Fetch businesses matching category and location
  // Location will be created only when businesses are assigned, not on page load
  const businesses = await getBusinessesByLocationSlug(
    locationSlug,
    category.id,
  );

  // Get location from DB for display (if exists), otherwise use parsed data
  const client = getSupabaseServerClient();
  const { data: location } = await client
    .from('locations')
    .select('id, name, slug, type')
    .eq('slug', locationSlug)
    .single();

  // Use location from DB if available, otherwise use parsed data for display
  const displayLocation = location || {
    id: '',
    name: parsedLocation.name,
    slug: locationSlug,
    type: parsedLocation.type,
  };

  return (
    <div className={'container mx-auto py-8'}>
      <LocationBreadcrumbs
        category={category}
        location={displayLocation}
      />

      <LocationHeader
        category={category}
        location={displayLocation}
        businessCount={businesses?.length ?? 0}
      />

      <LocationStructuredData
        category={category}
        location={displayLocation}
        businesses={businesses ?? []}
      />

      <BusinessGrid businesses={businesses ?? []} />
    </div>
  );
}

export default withI18n(CategoryLocationPage);



