import { cache } from 'react';

import { getDirectoryClient } from '~/lib/supabase/directory-client';

/**
 * Cached function to fetch category by slug
 * Uses React cache() to deduplicate requests within the same render
 */
export const getCategoryBySlug = cache(async (slug: string) => {
  const client = getDirectoryClient();

  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) {
    return null;
  }

  return data;
});
