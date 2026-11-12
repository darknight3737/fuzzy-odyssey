import 'server-only';
import { cache } from 'react';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

export type DirectoryBusiness = { id: string; name: string; slug: string; description: string | null; logo_url: string | null; tier: string; employee_count: number | null; works_remotely: boolean; offering_kind: string; min_budget: number | null; features?: string[]; integrations?: string[]; free_trial?: boolean; free_plan?: boolean; portuguese?: boolean; pricing_model?: string | null; deployment?: string[]; buyer_sizes?: string[]; support_languages?: string[] };
export type DirectoryItem = { business: DirectoryBusiness; average_rating: number | null; review_count: number; location_name?: string | null; works_count?: number };
export type DirectoryParams = Record<string, string | string[] | undefined>;
export function filtersFromParams(params: DirectoryParams) {
  const filters: Record<string, string | number | boolean | string[]> = {};
  for (const key of ['q', 'category', 'location', 'kind', 'sort', 'pricing_model']) { const value = params[key]; if (typeof value === 'string' && value) filters[key] = value.slice(0, 120); }
  for (const key of ['min_budget', 'max_budget', 'min_team', 'max_team', 'founded_before']) { const value = params[key]; if (typeof value === 'string' && /^\d{1,9}$/.test(value)) filters[key] = Number(value); }
  if (typeof params.min_rating === 'string' && /^[1-5]$/.test(params.min_rating)) filters.min_rating = Number(params.min_rating);
  for (const key of ['remote', 'has_works', 'has_awards', 'free_trial', 'free_plan', 'portuguese']) if (params[key] === 'true') filters[key] = true;
  for (const key of ['languages', 'features', 'integrations', 'buyer_sizes', 'support_languages', 'deployment']) { const value = params[key]; if (typeof value === 'string' && value.trim()) filters[key] = value.split(',').map((v) => v.trim()).filter(Boolean).slice(0, 10); }
  return filters;
}
export function directoryPage(params: DirectoryParams) { const page = params.page; return typeof page === 'string' && /^[1-9]\d{0,4}$/.test(page) ? Number(page) : 1; }
const searchMarketplaceCached = cache(async (serializedFilters: string, page: number) => {
  const filters = JSON.parse(serializedFilters) as ReturnType<typeof filtersFromParams>;
  const client = getDirectoryClient();
  const { data, error } = await client.rpc('search_marketplace', { p_filters: filters, p_limit: 24, p_offset: (page - 1) * 24 });
  if (error) throw error;
  return data as unknown as { items: DirectoryItem[]; total: number };
});

export function searchMarketplace(filters: ReturnType<typeof filtersFromParams>, page = 1) {
  return searchMarketplaceCached(JSON.stringify(filters), page);
}
