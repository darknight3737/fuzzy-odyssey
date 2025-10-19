import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { withI18n } from '~/lib/i18n/with-i18n';

import { BusinessGrid } from '../../categories/[slug]/_components/business-grid';
import { LocationHeader } from './_components/location-header';

type Props = {
  params: Promise<{ category: string; location: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug, location: locationSlug } = await params;
  const client = getSupabaseServerClient();

  // Resolve category (could be alias)
  const { data: category } = await client
    .from('categories')
    .select('id, name')
    .or(`slug.eq.${categorySlug}`)
    .single();

  const { data: location } = await client
    .from('locations')
    .select('name, type')
    .eq('slug', locationSlug)
    .single();

  if (!category || !location) {
    return { title: 'Not Found' };
  }

  const title = `Best ${category.name} in ${location.name}`;
  const description = `Find top ${category.name} providers in ${location.name}. Verified reviews, ratings, and contact information.`;

  return { title, description };
}

async function CategoryLocationPage({ params }: Props) {
  const { category: categorySlug, location: locationSlug } = await params;
  const client = getSupabaseServerClient();

  // Resolve category from slug or alias
  const { data: category } = await client
    .from('categories')
    .select('id, name, slug, description')
    .or(`slug.eq.${categorySlug}`)
    .single();

  const { data: location } = await client
    .from('locations')
    .select('id, name, slug, type')
    .eq('slug', locationSlug)
    .single();

  if (!category || !location) notFound();

  // Fetch businesses matching category and location
  const { data: businesses } = await client
    .from('businesses')
    .select(
      `
      id,
      name,
      slug,
      description,
      logo_url,
      tier,
      business_categories!inner(category_id),
      business_locations!inner(location_id)
    `,
    )
    .eq('business_categories.category_id', category.id)
    .eq('business_locations.location_id', location.id)
    .in('tier', ['verified', 'highlight', 'spotlight'])
    .order('tier', { ascending: false })
    .limit(50);

  return (
    <div className={'container mx-auto py-8'}>
      <LocationHeader
        category={category}
        location={location}
        businessCount={businesses?.length ?? 0}
      />

      <BusinessGrid businesses={businesses ?? []} />
    </div>
  );
}

export default withI18n(CategoryLocationPage);

