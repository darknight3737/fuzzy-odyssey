import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { withI18n } from '~/lib/i18n/with-i18n';

import { BusinessGrid } from './_components/business-grid';
import { CategoryHeader } from './_components/category-header';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const client = getSupabaseServerClient();

  const { data: category } = await client
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} - Selletive`,
    description: category.description,
  };
}

async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const client = getSupabaseServerClient();

  const { data: category, error } = await client
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    notFound();
  }

  if (!category) notFound();

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
      business_categories!inner(category_id)
    `,
    )
    .eq('business_categories.category_id', category.id)
    .in('tier', ['verified', 'highlight', 'spotlight'])
    .order('tier', { ascending: false })
    .limit(50);

  return (
    <div className={'container mx-auto py-8'}>
      <CategoryHeader category={category} />
      <BusinessGrid businesses={businesses ?? []} />
    </div>
  );
}

export default withI18n(CategoryPage);

