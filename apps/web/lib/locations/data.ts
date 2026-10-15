/**
 * Common locations data for search suggestions
 * This provides a basic set of popular cities/states/countries
 * Can be extended with external API calls for complete coverage
 */

export interface LocationSuggestion {
  name: string;
  slug: string;
  type: 'country' | 'state' | 'city';
  countryCode: string;
  stateCode?: string;
}

/**
 * Common countries (popular ones for B2B services)
 */
const COMMON_COUNTRIES: Omit<LocationSuggestion, 'stateCode'>[] = [
  {
    name: 'United States',
    slug: 'united-states-us',
    type: 'country',
    countryCode: 'us',
  },
  { name: 'Brazil', slug: 'brazil-br', type: 'country', countryCode: 'br' },
  {
    name: 'United Kingdom',
    slug: 'united-kingdom-gb',
    type: 'country',
    countryCode: 'gb',
  },
  { name: 'Canada', slug: 'canada-ca', type: 'country', countryCode: 'ca' },
  { name: 'Germany', slug: 'germany-de', type: 'country', countryCode: 'de' },
  { name: 'France', slug: 'france-fr', type: 'country', countryCode: 'fr' },
  { name: 'Spain', slug: 'spain-es', type: 'country', countryCode: 'es' },
  { name: 'Italy', slug: 'italy-it', type: 'country', countryCode: 'it' },
  {
    name: 'Netherlands',
    slug: 'netherlands-nl',
    type: 'country',
    countryCode: 'nl',
  },
  {
    name: 'Australia',
    slug: 'australia-au',
    type: 'country',
    countryCode: 'au',
  },
  { name: 'Japan', slug: 'japan-jp', type: 'country', countryCode: 'jp' },
  { name: 'India', slug: 'india-in', type: 'country', countryCode: 'in' },
  { name: 'Mexico', slug: 'mexico-mx', type: 'country', countryCode: 'mx' },
  {
    name: 'Argentina',
    slug: 'argentina-ar',
    type: 'country',
    countryCode: 'ar',
  },
  { name: 'Portugal', slug: 'portugal-pt', type: 'country', countryCode: 'pt' },
];

/**
 * Common US states
 */
const COMMON_US_STATES: LocationSuggestion[] = [
  {
    name: 'California',
    slug: 'california-ca-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'ca',
  },
  {
    name: 'New York',
    slug: 'new-york-ny-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'ny',
  },
  {
    name: 'Texas',
    slug: 'texas-tx-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'tx',
  },
  {
    name: 'Florida',
    slug: 'florida-fl-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'fl',
  },
  {
    name: 'Illinois',
    slug: 'illinois-il-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'il',
  },
  {
    name: 'Pennsylvania',
    slug: 'pennsylvania-pa-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'pa',
  },
  {
    name: 'Ohio',
    slug: 'ohio-oh-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'oh',
  },
  {
    name: 'Georgia',
    slug: 'georgia-ga-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'ga',
  },
  {
    name: 'North Carolina',
    slug: 'north-carolina-nc-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'nc',
  },
  {
    name: 'Michigan',
    slug: 'michigan-mi-us',
    type: 'state',
    countryCode: 'us',
    stateCode: 'mi',
  },
];

/**
 * Common Brazilian states
 */
const COMMON_BR_STATES: LocationSuggestion[] = [
  {
    name: 'São Paulo',
    slug: 'sao-paulo-sp-br',
    type: 'state',
    countryCode: 'br',
    stateCode: 'sp',
  },
  {
    name: 'Rio de Janeiro',
    slug: 'rio-de-janeiro-rj-br',
    type: 'state',
    countryCode: 'br',
    stateCode: 'rj',
  },
  {
    name: 'Minas Gerais',
    slug: 'minas-gerais-mg-br',
    type: 'state',
    countryCode: 'br',
    stateCode: 'mg',
  },
  {
    name: 'Rio Grande do Sul',
    slug: 'rio-grande-do-sul-rs-br',
    type: 'state',
    countryCode: 'br',
    stateCode: 'rs',
  },
  {
    name: 'Paraná',
    slug: 'parana-pr-br',
    type: 'state',
    countryCode: 'br',
    stateCode: 'pr',
  },
];

/**
 * Major cities (global)
 */
const COMMON_CITIES: LocationSuggestion[] = [
  // US Cities
  {
    name: 'New York',
    slug: 'new-york-ny-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'ny',
  },
  {
    name: 'Los Angeles',
    slug: 'los-angeles-ca-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'ca',
  },
  {
    name: 'Chicago',
    slug: 'chicago-il-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'il',
  },
  {
    name: 'Houston',
    slug: 'houston-tx-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'tx',
  },
  {
    name: 'Phoenix',
    slug: 'phoenix-az-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'az',
  },
  {
    name: 'Philadelphia',
    slug: 'philadelphia-pa-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'pa',
  },
  {
    name: 'San Antonio',
    slug: 'san-antonio-tx-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'tx',
  },
  {
    name: 'San Diego',
    slug: 'san-diego-ca-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'ca',
  },
  {
    name: 'Dallas',
    slug: 'dallas-tx-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'tx',
  },
  {
    name: 'San Jose',
    slug: 'san-jose-ca-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'ca',
  },
  {
    name: 'Austin',
    slug: 'austin-tx-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'tx',
  },
  {
    name: 'Miami',
    slug: 'miami-fl-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'fl',
  },
  {
    name: 'Seattle',
    slug: 'seattle-wa-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'wa',
  },
  {
    name: 'Boston',
    slug: 'boston-ma-us',
    type: 'city',
    countryCode: 'us',
    stateCode: 'ma',
  },
  // Brazil Cities
  {
    name: 'São Paulo',
    slug: 'sao-paulo-sp-br',
    type: 'city',
    countryCode: 'br',
    stateCode: 'sp',
  },
  {
    name: 'Rio de Janeiro',
    slug: 'rio-de-janeiro-rj-br',
    type: 'city',
    countryCode: 'br',
    stateCode: 'rj',
  },
  {
    name: 'Brasília',
    slug: 'brasilia-df-br',
    type: 'city',
    countryCode: 'br',
    stateCode: 'df',
  },
  {
    name: 'Salvador',
    slug: 'salvador-ba-br',
    type: 'city',
    countryCode: 'br',
    stateCode: 'ba',
  },
  {
    name: 'Fortaleza',
    slug: 'fortaleza-ce-br',
    type: 'city',
    countryCode: 'br',
    stateCode: 'ce',
  },
  {
    name: 'Belo Horizonte',
    slug: 'belo-horizonte-mg-br',
    type: 'city',
    countryCode: 'br',
    stateCode: 'mg',
  },
  {
    name: 'Manaus',
    slug: 'manaus-am-br',
    type: 'city',
    countryCode: 'br',
    stateCode: 'am',
  },
  {
    name: 'Curitiba',
    slug: 'curitiba-pr-br',
    type: 'city',
    countryCode: 'br',
    stateCode: 'pr',
  },
  // European Cities
  { name: 'London', slug: 'london-gb', type: 'city', countryCode: 'gb' },
  { name: 'Paris', slug: 'paris-fr', type: 'city', countryCode: 'fr' },
  { name: 'Berlin', slug: 'berlin-de', type: 'city', countryCode: 'de' },
  { name: 'Madrid', slug: 'madrid-es', type: 'city', countryCode: 'es' },
  { name: 'Rome', slug: 'rome-it', type: 'city', countryCode: 'it' },
  { name: 'Amsterdam', slug: 'amsterdam-nl', type: 'city', countryCode: 'nl' },
  // Other Major Cities
  { name: 'Tokyo', slug: 'tokyo-jp', type: 'city', countryCode: 'jp' },
  { name: 'Sydney', slug: 'sydney-au', type: 'city', countryCode: 'au' },
  {
    name: 'Toronto',
    slug: 'toronto-on-ca',
    type: 'city',
    countryCode: 'ca',
    stateCode: 'on',
  },
  {
    name: 'Vancouver',
    slug: 'vancouver-bc-ca',
    type: 'city',
    countryCode: 'ca',
    stateCode: 'bc',
  },
  {
    name: 'Mexico City',
    slug: 'mexico-city-mx',
    type: 'city',
    countryCode: 'mx',
  },
  {
    name: 'Buenos Aires',
    slug: 'buenos-aires-ar',
    type: 'city',
    countryCode: 'ar',
  },
  { name: 'Mumbai', slug: 'mumbai-in', type: 'city', countryCode: 'in' },
  { name: 'Bangalore', slug: 'bangalore-in', type: 'city', countryCode: 'in' },
  { name: 'Lisbon', slug: 'lisbon-pt', type: 'city', countryCode: 'pt' },
];

/**
 * All location suggestions combined
 */
export const LOCATION_SUGGESTIONS: LocationSuggestion[] = [
  ...COMMON_COUNTRIES,
  ...COMMON_US_STATES,
  ...COMMON_BR_STATES,
  ...COMMON_CITIES,
];

/**
 * Search locations by query string
 * Searches through name and slug
 */
export function searchLocationSuggestions(query: string): LocationSuggestion[] {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const lowerQuery = query.trim().toLowerCase();

  return LOCATION_SUGGESTIONS.filter(
    (location) =>
      location.name.toLowerCase().includes(lowerQuery) ||
      location.slug.toLowerCase().includes(lowerQuery),
  );
}
