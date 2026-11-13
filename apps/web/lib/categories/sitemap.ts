import 'server-only';
import { taxonomyKind } from '~/lib/directory/taxonomy';
import type { Database } from '~/lib/database.types';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import { getPopulatedCategoryIds } from './visibility';

type Category = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'parent_id' | 'slug' | 'updated_at'
>;

const batchSize = 1000;

export async function getActiveCategories() {
  const client = getDirectoryClient();
  const categories: Category[] = [];
  for (let start = 0; ; start += batchSize) {
    const { data, error } = await client
      .from('categories')
      .select('id,parent_id,slug,updated_at')
      .eq('is_active', true)
      .order('id')
      .range(start, start + batchSize - 1);
    if (error) throw error;
    categories.push(...data);
    if (data.length < batchSize) return categories;
  }
}

async function getAssignedCategoryIds() {
  const client = getDirectoryClient();
  const ids: string[] = [];
  for (let start = 0; ; start += batchSize) {
    const { data, error } = await client
      .from('business_categories')
      .select(
        'category_id,businesses!inner(offering_kind),categories!inner(slug)',
      )
      .order('id')
      .range(start, start + batchSize - 1);
    if (error) throw error;
    ids.push(
      ...data
        .filter(
          (row) =>
            taxonomyKind(row.categories.slug) === row.businesses.offering_kind,
        )
        .map((row) => row.category_id),
    );
    if (data.length < batchSize) return ids;
  }
}

export async function getIndexableCategories() {
  const [categories, assigned] = await Promise.all([
    getActiveCategories(),
    getAssignedCategoryIds(),
  ]);
  const populated = getPopulatedCategoryIds(categories, assigned);
  return categories
    .filter((category) => populated.has(category.id))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
