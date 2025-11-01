import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { ParsedLocation } from './utils';
import { parseLocationSlug } from './utils';

/**
 * Gets or creates a location in the database based on a slug
 * Simplified: Only creates the requested location, not parents
 * Parents are created on-demand when businesses are assigned
 */
export async function getOrCreateLocationBySlug(
  slug: string,
): Promise<{
  id: string;
  name: string;
  slug: string;
  type: 'country' | 'state' | 'city';
} | null> {
  const client = getSupabaseServerClient();

  // First, try to find existing location
  const { data: existing } = await client
    .from('locations')
    .select('id, name, slug, type')
    .eq('slug', slug)
    .single();

  if (existing) {
    return existing;
  }

  // Parse the slug to extract location info
  let parsed: ParsedLocation;
  try {
    parsed = parseLocationSlug(slug);
  } catch (error) {
    console.error(`Failed to parse location slug: ${slug}`, error);
    return null;
  }

  // Only create the requested location
  // Parent locations (country/state) will be created when needed via business assignment
  let parentId: string | null = null;

  // Try to find parent if this is a city/state
  if (parsed.type === 'city' || parsed.type === 'state') {
    // For state, try to find country
    if (parsed.type === 'state') {
      const countryName = getCountryName(parsed.countryCode);
      const countrySlug = generateCountrySlug(countryName, parsed.countryCode);
      const { data: country } = await client
        .from('locations')
        .select('id')
        .eq('slug', countrySlug)
        .eq('type', 'country')
        .single();

      if (country) {
        parentId = country.id;
      }
    }

    // For city, try to find state first, then country
    if (parsed.type === 'city' && parsed.stateCode) {
      // Try to find state
      const stateName = parsed.name; // Assuming city name might match state for simplicity
      const stateSlug = `${stateName.toLowerCase().replace(/\s+/g, '-')}-${parsed.stateCode}-${parsed.countryCode}`;
      const { data: state } = await client
        .from('locations')
        .select('id')
        .eq('slug', stateSlug)
        .eq('type', 'state')
        .single();

      if (state) {
        parentId = state.id;
      } else {
        // Fallback to country
        const countryName = getCountryName(parsed.countryCode);
        const countrySlug = generateCountrySlug(countryName, parsed.countryCode);
        const { data: country } = await client
          .from('locations')
          .select('id')
          .eq('slug', countrySlug)
          .eq('type', 'country')
          .single();

        if (country) {
          parentId = country.id;
        }
      }
    }
  }

  // Create only the requested location
  const { data: newLocation, error: locationError } = await client
    .from('locations')
    .insert({
      name: parsed.name,
      slug: slug,
      type: parsed.type,
      country_code: parsed.countryCode,
      state_code: parsed.stateCode || null,
      parent_id: parentId,
    })
    .select('id, name, slug, type')
    .single();

  if (locationError || !newLocation) {
    // If insert fails due to duplicate, try to fetch again
    if (locationError?.code === '23505') {
      const { data: found } = await client
        .from('locations')
        .select('id, name, slug, type')
        .eq('slug', slug)
        .single();

      if (found) {
        return found;
      }
    }
    console.error('Failed to create location', locationError);
    return null;
  }

  return newLocation;
}

/**
 * Gets country name from country code
 * Uses a fallback that generates a readable name if not in the list
 */
export function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    br: 'Brazil',
    us: 'United States',
    ca: 'Canada',
    gb: 'United Kingdom',
    uk: 'United Kingdom',
    au: 'Australia',
    de: 'Germany',
    fr: 'France',
    es: 'Spain',
    mx: 'Mexico',
    ar: 'Argentina',
    cl: 'Chile',
    jp: 'Japan',
    cn: 'China',
    in: 'India',
    ru: 'Russia',
    kr: 'South Korea',
    it: 'Italy',
    nl: 'Netherlands',
    se: 'Sweden',
    no: 'Norway',
    dk: 'Denmark',
    fi: 'Finland',
    pl: 'Poland',
    pt: 'Portugal',
    gr: 'Greece',
    tr: 'Turkey',
    za: 'South Africa',
    eg: 'Egypt',
    nz: 'New Zealand',
    ie: 'Ireland',
    ch: 'Switzerland',
    at: 'Austria',
    be: 'Belgium',
    // Add more as needed - this is a reasonable fallback for common countries
  };

  const code = countryCode.toLowerCase();
  if (countryNames[code]) {
    return countryNames[code];
  }

  // Fallback: Try to generate a readable name from code
  // This is better than just returning "JP" or similar
  return code.toUpperCase();
}

/**
 * Generates a country slug following PRD pattern: [name]-[country-code]
 * Example: "brazil-br", "united-states-us"
 */
export function generateCountrySlug(countryName: string, countryCode: string): string {
  const nameSlug = countryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  return `${nameSlug}-${countryCode.toLowerCase()}`;
}

/**
 * Finds businesses by location slug
 * Optimized: Only creates location if businesses exist, otherwise returns empty
 */
export async function getBusinessesByLocationSlug(
  locationSlug: string,
  categoryId?: string,
) {
  const client = getSupabaseServerClient();

  // First, try to find existing location
  const { data: location } = await client
    .from('locations')
    .select('id')
    .eq('slug', locationSlug)
    .single();

  // If location doesn't exist, check if there are any businesses that would use it
  // Only create location if we're going to query businesses
  let locationId: string | null = null;

  if (location) {
    locationId = location.id;
  } else {
    // Location doesn't exist - no businesses can be linked to it yet
    // Return empty array without creating location
    // Location will be created when a business is actually assigned
    return [];
  }

  // Query businesses with this location
  let query = client
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
    .eq('business_locations.location_id', locationId)
    .in('tier', ['verified', 'highlight', 'spotlight']);

  if (categoryId) {
    query = query.eq('business_categories.category_id', categoryId);
  }

  const { data } = await query
    .order('tier', { ascending: false })
    .limit(50);

  return data || [];
}

