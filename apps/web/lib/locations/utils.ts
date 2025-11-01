/**
 * Location slug parsing and generation utilities
 * 
 * Location slugs follow PRD pattern: [name]-[code]-[country-code]
 * 
 * Examples:
 * - Country: "brazil-br"
 * - State: "sao-paulo-sp-br"  
 * - City: "sao-paulo-sp-br" or "san-francisco-ca-us"
 */

export type LocationType = 'country' | 'state' | 'city';

export interface ParsedLocation {
  /** Location name (e.g., "São Paulo", "Brazil") */
  name: string;
  /** Location type: country, state, or city */
  type: LocationType;
  /** Country code (e.g., "br", "us") */
  countryCode: string;
  /** State/province code (e.g., "sp", "ca") - only for state/city */
  stateCode?: string;
  /** City name (only for cities) */
  cityName?: string;
  /** Original slug */
  slug: string;
}

/**
 * Parses a location slug into its components
 * 
 * @example
 * parseLocationSlug("brazil-br") 
 * // { name: "Brazil", type: "country", countryCode: "br", slug: "brazil-br" }
 * 
 * @example
 * parseLocationSlug("sao-paulo-sp-br")
 * // { name: "São Paulo", type: "state", countryCode: "br", stateCode: "sp", slug: "sao-paulo-sp-br" }
 */
export function parseLocationSlug(slug: string): ParsedLocation {
  const parts = slug.split('-');
  
  // Extract country code (last 2 characters after last hyphen)
  const countryCode = parts[parts.length - 1]?.toLowerCase();
  
  if (!countryCode || countryCode.length !== 2) {
    throw new Error(`Invalid location slug format: ${slug}`);
  }

  // Determine location type based on parts length
  // Format: [name]-[country] = country (2 parts)
  // Format: [name]-[state]-[country] = state (3 parts)
  // Format: [name]-[state]-[country] or [city]-[state]-[country] = city/state (3+ parts)
  
  if (parts.length === 2) {
    // Country level: "brazil-br"
    const name = formatLocationName(parts[0]);
    return {
      name,
      type: 'country',
      countryCode,
      slug,
    };
  } else if (parts.length === 3) {
    // State level: "sao-paulo-sp-br" 
    // Could also be a city with same name as state
    const stateCode = parts[1]?.toLowerCase();
    const name = formatLocationName(parts[0]);
    
    return {
      name,
      type: 'state', // Default to state, can be refined later
      countryCode,
      stateCode,
      slug,
    };
  } else {
    // City level or multi-word state: "san-francisco-ca-us"
    // Last two parts are always state-code and country-code
    const stateCode = parts[parts.length - 2]?.toLowerCase();
    const nameParts = parts.slice(0, -2);
    const name = formatLocationName(nameParts.join(' '));
    
    return {
      name,
      type: 'city',
      countryCode,
      stateCode,
      cityName: name,
      slug,
    };
  }
}

/**
 * Formats a location name for display
 * Converts "sao-paulo" → "São Paulo"
 */
function formatLocationName(slugName: string): string {
  // Convert hyphenated to title case
  return slugName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generates a location slug from components
 * 
 * @example
 * generateLocationSlug("São Paulo", "sp", "br", "state")
 * // Returns: "sao-paulo-sp-br"
 */
export function generateLocationSlug(
  name: string,
  stateCode: string | undefined,
  countryCode: string,
  type: LocationType,
): string {
  const nameSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  if (type === 'country') {
    return `${nameSlug}-${countryCode}`;
  }

  if (!stateCode) {
    throw new Error('State code required for state and city locations');
  }

  if (type === 'state') {
    return `${nameSlug}-${stateCode}-${countryCode}`;
  }

  // City type
  return `${nameSlug}-${stateCode}-${countryCode}`;
}

/**
 * Validates if a location slug follows the expected format
 */
export function isValidLocationSlug(slug: string): boolean {
  try {
    parseLocationSlug(slug);
    return true;
  } catch {
    return false;
  }
}

