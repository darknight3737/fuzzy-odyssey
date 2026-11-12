import 'server-only';
import { cache } from 'react';

import { getDirectoryClient } from '~/lib/supabase/directory-client';

import { categoryLabel } from './category-label';

export type DirectoryOption = { value: string; label: string };
export type DirectoryOptions = {
  categories: DirectoryOption[];
  locations: DirectoryOption[];
};

export const getDirectoryOptions = cache(async (
  category: string | undefined,
  location: string | undefined,
  includeCategories: boolean,
  includeLocations: boolean,
): Promise<DirectoryOptions> => {
  const client = getDirectoryClient();
  const [categories, locations, selectedCategory, selectedLocation] = await Promise.all([
    includeCategories ? client.from('categories').select('slug,name').eq('is_active', true).order('name').limit(200) : null,
    includeLocations ? client.from('locations').select('slug,name,state_code,type').eq('country_code', 'br').order('type', {ascending:false}).order('name').limit(200) : null,
    includeCategories && category ? client.from('categories').select('slug,name').eq('is_active', true).eq('slug', category).maybeSingle() : null,
    includeLocations && location ? client.from('locations').select('slug,name,state_code,type').eq('slug', location).maybeSingle() : null,
  ]);
  const unique = <T extends { slug: string }>(items: T[], selected: T | null | undefined) => selected && !items.some(item => item.slug === selected.slug) ? [...items, selected] : items;
  return {
    categories: unique(categories?.data ?? [], selectedCategory?.data).map(item => ({value:item.slug, label:categoryLabel(item.slug,item.name)})),
    locations: unique(locations?.data ?? [], selectedLocation?.data).map(item => ({value:item.slug, label:item.type === 'city' && item.state_code ? `${item.name} – ${item.state_code.toUpperCase()}` : item.name})),
  };
});
