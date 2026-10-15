import { Suspense } from 'react';

import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { connection } from 'next/server';

import appConfig from '~/config/app.config';
import { resolveCategoryFromSlug } from '~/lib/categories/server';
import { getBusinessesByLocationSlug } from '~/lib/locations/server';
import { parseLocationSlug } from '~/lib/locations/utils';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import { BusinessGrid } from '../../categories/[slug]/_components/business-grid';
import { LocationBreadcrumbs } from './_components/location-breadcrumbs';
import { LocationHeader } from './_components/location-header';
import { LocationStructuredData } from './_components/location-structured-data';

type Props = {
  params: Promise<{ category: string; location: string }>;
};

// ISR: Revalidate every hour per PRD requirement

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { category: categorySlug, location: locationSlug } = await params;

  // Resolve category (could be alias) - per PRD requirement
  const category = await resolveCategoryFromSlug(categorySlug);

  if (!category) {
    await connection();
    return { title: 'Not Found' };
  }

  const client = getDirectoryClient();
  const { data: location } = await client
    .from('locations')
    .select('name')
    .eq('slug', locationSlug)
    .maybeSingle();
  if (!location) return { robots: { index: false, follow: true } };
  const businesses = await getBusinessesByLocationSlug(
    locationSlug,
    category.id,
  );
  const locationName = location.name;

  const title = `${category.name} em ${locationName} | Selletive`;
  const description = `Encontre empresas de ${category.name} em ${locationName}. Compare especialidades, avaliações publicadas e informações de contato.`;
  const canonicalUrl = `${appConfig.url}/${category.slug}/${locationSlug}`;

  return {
    title,
    description,
    robots: { index: businesses.length > 0, follow: true },
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
  await connection();
  const { category: categorySlug, location: locationSlug } = await params;

  // Validate location slug format
  try {
    parseLocationSlug(locationSlug);
  } catch {
    // Invalid slug format - return 404
    notFound();
  }

  // Resolve category from slug or alias - per PRD requirement
  const category = await resolveCategoryFromSlug(categorySlug);

  if (!category) notFound();
  if (category.slug !== categorySlug)
    permanentRedirect(`/${category.slug}/${locationSlug}`);

  // Fetch businesses matching category and location
  // Location will be created only when businesses are assigned, not on page load
  const businesses = await getBusinessesByLocationSlug(
    locationSlug,
    category.id,
  );

  // Get location from DB for display (if exists), otherwise use parsed data
  const client = getDirectoryClient();
  const { data: location } = await client
    .from('locations')
    .select('id, name, slug, type')
    .eq('slug', locationSlug)
    .single();

  if (!location) notFound();
  const displayLocation = location;

  return (
    <div className={'container mx-auto py-8'}>
      <LocationBreadcrumbs category={category} location={displayLocation} />

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

export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <div role="status" className="container mx-auto min-h-96 px-6 py-12">
          Carregando…
        </div>
      }
    >
      <CategoryLocationPage {...props} />
    </Suspense>
  );
}
