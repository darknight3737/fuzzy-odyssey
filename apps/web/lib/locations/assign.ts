import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { parseLocationSlug } from './utils';
import {
  getOrCreateLocationBySlug,
  generateCountrySlug,
  getCountryName,
} from './server';

/**
 * Assigns a business to a location, creating the location hierarchy if needed
 * Per PRD: Auto-assigns parent locations (country, state) when business selects a city
 * 
 * @param businessId - The business ID
 * @param locationSlug - The location slug (e.g., "sao-paulo-sp-br")
 * @param isPrimary - Whether this is the primary location for the business
 */
export async function assignBusinessToLocation(
  businessId: string,
  locationSlug: string,
  isPrimary: boolean = false,
): Promise<{ success: boolean; locationId: string | null }> {
  const client = getSupabaseServerClient();

  // Parse the location slug
  let parsed;
  try {
    parsed = parseLocationSlug(locationSlug);
  } catch (error) {
    console.error('Invalid location slug:', locationSlug, error);
    return { success: false, locationId: null };
  }

  // Get or create the requested location (and its parents if needed)
  const location = await getOrCreateLocationBySlug(locationSlug);

  if (!location) {
    return { success: false, locationId: null };
  }

  // Auto-assign parent locations per PRD requirements
  // When a business selects a city, also assign to state and country
  const locationIds: Array<{ locationId: string; isPrimary: boolean }> = [
    { locationId: location.id, isPrimary },
  ];

  // Get parent locations
  if (parsed.type === 'city' || parsed.type === 'state') {
    // Get or create state (if city)
    if (parsed.type === 'city' && parsed.stateCode) {
      // For state slug, we need to check if a state location with this state code exists
      // State name might be different from city name (e.g., city "São Paulo" is in state "São Paulo")
      // Strategy: Try to find existing state by state code, otherwise use city name as fallback
      const client = getSupabaseServerClient();
      const { data: existingState } = await client
        .from('locations')
        .select('slug, name')
        .eq('state_code', parsed.stateCode)
        .eq('country_code', parsed.countryCode)
        .eq('type', 'state')
        .single();

      let stateSlug: string;
      if (existingState) {
        // Use existing state
        stateSlug = existingState.slug;
        locationIds.push({ locationId: existingState.id, isPrimary: false });
      } else {
        // Create state using state code - state name defaults to state code or city name
        // Note: This is a simplification - in production you'd have proper state name data
        const stateNameFallback = parsed.name; // Will be corrected when state is created properly
        stateSlug = `${stateNameFallback.toLowerCase().replace(/\s+/g, '-')}-${parsed.stateCode}-${parsed.countryCode}`;
        const stateLocation = await getOrCreateLocationBySlug(stateSlug);

        if (stateLocation) {
          locationIds.push({ locationId: stateLocation.id, isPrimary: false });
        }
      }
    } else if (parsed.type === 'state') {
      // If assigning a state directly, still need country
      // (This case is handled below)
    }

    // Get or create country
    const countryName = getCountryName(parsed.countryCode);
    const countrySlug = generateCountrySlug(countryName, parsed.countryCode);
    const countryLocation = await getOrCreateLocationBySlug(countrySlug);

    if (countryLocation) {
      locationIds.push({ locationId: countryLocation.id, isPrimary: false });
    }
  }

  // Assign business to all location levels
  const assignments = locationIds.map(({ locationId, isPrimary: primary }) => ({
    business_id: businessId,
    location_id: locationId,
    is_primary: primary,
  }));

  const { error } = await client
    .from('business_locations')
    .upsert(assignments, {
      onConflict: 'business_id,location_id',
    });

  if (error) {
    console.error('Failed to assign business to locations:', error);
    return { success: false, locationId: location.id };
  }

  return { success: true, locationId: location.id };
}

