import { getDirectoryClient } from '~/lib/supabase/directory-client';

import {
  LOCATION_SUGGESTIONS,
  type LocationSuggestion,
  searchLocationSuggestions,
} from './data';

type LocationSearchResult = {
  id: string;
  name: string;
  slug: string;
  type: 'country' | 'state' | 'city';
};

/**
 * Search locations from database and suggestions
 * Combines DB locations with static suggestions for better coverage
 */
export async function searchLocations(
  query: string,
  limit: number = 50,
): Promise<LocationSearchResult[]> {
  const client = getDirectoryClient();
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 3) {
    return [];
  }

  // Search database locations
  const { data: dbLocations } = await client
    .from('locations')
    .select('id, name, slug, type')
    .or(`name.ilike.%${trimmedQuery}%,slug.ilike.%${trimmedQuery}%`)
    .order('name')
    .limit(limit);

  // Convert DB results to format
  const dbResults: LocationSearchResult[] =
    dbLocations?.map((loc) => ({
      id: loc.id,
      name: loc.name,
      slug: loc.slug,
      type: loc.type as 'country' | 'state' | 'city',
    })) || [];

  // Also search suggestions
  const suggestions = searchLocationSuggestions(trimmedQuery);

  // Combine and deduplicate by slug
  const allResults = new Map<string, LocationSearchResult>();

  // Add DB results first (they have IDs)
  dbResults.forEach((result) => {
    allResults.set(result.slug, result);
  });

  // Add suggestions that aren't already in DB
  suggestions.forEach((suggestion) => {
    if (!allResults.has(suggestion.slug)) {
      // For suggestions not in DB, we'll create a temporary ID
      // The actual location will be created when selected
      allResults.set(suggestion.slug, {
        id: `suggestion-${suggestion.slug}`, // Temporary ID
        name: suggestion.name,
        slug: suggestion.slug,
        type: suggestion.type,
      });
    }
  });

  // Convert to array and limit
  return Array.from(allResults.values()).slice(0, limit);
}

/**
 * Get all locations for filter dropdown
 * Returns DB locations + common suggestions
 */
export async function getAllLocationsForFilter(): Promise<
  LocationSearchResult[]
> {
  const client = getDirectoryClient();

  // Get all DB locations
  const { data: dbLocations } = await client
    .from('locations')
    .select('id, name, slug, type')
    .order('name');

  const dbResults: LocationSearchResult[] =
    dbLocations?.map((loc) => ({
      id: loc.id,
      name: loc.name,
      slug: loc.slug,
      type: loc.type as 'country' | 'state' | 'city',
    })) || [];

  // Add common suggestions (countries and major cities)
  // Only add if not already in DB
  const suggestionMap = new Map<string, LocationSuggestion>();
  LOCATION_SUGGESTIONS.forEach((suggestion) => {
    suggestionMap.set(suggestion.slug, suggestion);
  });

  // Filter out suggestions that are already in DB
  const dbSlugs = new Set(dbResults.map((r) => r.slug));
  const additionalSuggestions = LOCATION_SUGGESTIONS.filter(
    (suggestion) => !dbSlugs.has(suggestion.slug),
  );

  const suggestionResults: LocationSearchResult[] = additionalSuggestions.map(
    (suggestion) => ({
      id: `suggestion-${suggestion.slug}`, // Temporary ID
      name: suggestion.name,
      slug: suggestion.slug,
      type: suggestion.type,
    }),
  );

  // Combine: DB locations first, then suggestions
  return [...dbResults, ...suggestionResults].slice(0, 500); // Limit to 500 total
}
