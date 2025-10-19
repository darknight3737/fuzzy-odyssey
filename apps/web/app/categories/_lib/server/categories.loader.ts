import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export const loadCategories = cache(async () => {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, description, icon, level')
    .eq('level', 1)
    .order('name');

  if (error) throw error;

  return data;
});

