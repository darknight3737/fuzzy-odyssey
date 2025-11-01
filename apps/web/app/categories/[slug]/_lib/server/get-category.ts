import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * Cached function to fetch category by slug
 * Uses React cache() to deduplicate requests within the same render
 */
export const getCategoryBySlug = cache(async (slug: string) => {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
});

