import { cache } from 'react';

import { getDirectoryClient } from '~/lib/supabase/directory-client';

export const loadCategories = cache(async () => {
  const client = getDirectoryClient();

  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, description, icon, level')
    .eq('level', 1)
    .order('name');

  if (error) throw error;

  return data;
});
