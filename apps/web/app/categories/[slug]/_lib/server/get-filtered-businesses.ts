import { getSupabaseServerClient } from '@kit/supabase/server-client';

type FilterParams = {
  categoryId: string;
  location?: string;
  minRating?: number;
  languages?: string[];
  teamSize?: string;
  worksRemotely?: boolean;
  foundedYear?: string;
  sort?: 'relevancy' | 'rating' | 'name';
};

type BusinessWithRating = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  tier: string;
  employee_count: number | null;
  works_remotely: boolean;
  founded_year: number | null;
  business_languages: string[];
  average_rating: number | null;
  review_count: number;
  business_locations?: Array<{
    locations: {
      name: string;
      slug: string;
    } | null;
  }>;
};

export async function getFilteredBusinesses(
  params: FilterParams,
): Promise<BusinessWithRating[]> {
  const client = getSupabaseServerClient();

  // Get location ID if filtering by location
  let locationId: string | null = null;
  if (params.location) {
    const { data: location } = await client
      .from('locations')
      .select('id')
      .eq('slug', params.location)
      .single();

    if (location) {
      locationId = location.id;
    } else {
      // Location not found, return empty
      return [];
    }
  }

  // Build query with conditional location join
  const selectFields = locationId
    ? `
      id,
      name,
      slug,
      description,
      logo_url,
      tier,
      employee_count,
      works_remotely,
      founded_year,
      business_languages,
      business_categories!inner(category_id),
      business_locations!inner(location_id, locations(name, slug))
    `
    : `
      id,
      name,
      slug,
      description,
      logo_url,
      tier,
      employee_count,
      works_remotely,
      founded_year,
      business_languages,
      business_categories!inner(category_id),
      business_locations(locations(name, slug))
    `;

  let query = client
    .from('businesses')
    .select(selectFields)
    .eq('business_categories.category_id', params.categoryId)
    .in('tier', ['verified', 'highlight', 'spotlight']);

  // Apply location filter using inner join
  if (locationId) {
    query = query.eq('business_locations.location_id', locationId);
  }

  // Apply works remotely filter
  if (params.worksRemotely === true) {
    query = query.eq('works_remotely', true);
  }

  // Apply team size filter
  if (params.teamSize) {
    const [min, max] = parseTeamSizeRange(params.teamSize);
    if (min !== null) {
      query = query.gte('employee_count', min);
    }
    if (max !== null) {
      query = query.lte('employee_count', max);
    }
  }

  // Apply founded year filter
  if (params.foundedYear) {
    const [minYear, maxYear] = parseFoundedYearRange(params.foundedYear);
    if (minYear !== null) {
      query = query.gte('founded_year', minYear);
    }
    if (maxYear !== null) {
      query = query.lte('founded_year', maxYear);
    }
  }

  // Apply languages filter (businesses must have at least one of the selected languages)
  if (params.languages && params.languages.length > 0) {
    query = query.overlaps('business_languages', params.languages);
  }

  // Get all businesses first
  const { data: businesses } = await query;

  if (!businesses || businesses.length === 0) {
    return [];
  }

  const businessIds = businesses.map((b) => b.id);

  // Fetch reviews and calculate ratings in parallel
  // Use a single query with aggregation for better performance
  const { data: reviewsData } = await client
    .from('reviews')
    .select('business_id, rating')
    .in('business_id', businessIds)
    .eq('status', 'approved');

  // Calculate average rating and review count per business
  const ratingsMap = new Map<string, { total: number; count: number }>();

  reviewsData?.forEach((review) => {
    const existing = ratingsMap.get(review.business_id) || {
      total: 0,
      count: 0,
    };
    ratingsMap.set(review.business_id, {
      total: existing.total + review.rating,
      count: existing.count + 1,
    });
  });

  // Add ratings to businesses and apply rating filter in one pass
  let businessesWithRatings: BusinessWithRating[] = businesses
    .map((business) => {
      const ratingData = ratingsMap.get(business.id);
      const averageRating = ratingData
        ? Math.round((ratingData.total / ratingData.count) * 10) / 10
        : null;
      const reviewCount = ratingData?.count || 0;

      return {
        ...business,
        average_rating: averageRating,
        review_count: reviewCount,
      };
    })
    .filter((business) => {
      // Apply rating filter if specified (must have at least minRating average)
      if (params.minRating !== undefined) {
        return (
          business.average_rating !== null &&
          business.average_rating >= params.minRating!
        );
      }
      return true;
    });

  // Apply sorting
  if (params.sort === 'rating') {
    businessesWithRatings.sort((a, b) => {
      const ratingA = a.average_rating ?? 0;
      const ratingB = b.average_rating ?? 0;
      return ratingB - ratingA;
    });
  } else if (params.sort === 'name') {
    businessesWithRatings.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Default: relevancy (tier priority, then rating)
    businessesWithRatings.sort((a, b) => {
      const tierOrder: Record<string, number> = {
        spotlight: 3,
        highlight: 2,
        verified: 1,
      };
      const tierDiff = (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
      if (tierDiff !== 0) return tierDiff;

      const ratingA = a.average_rating ?? 0;
      const ratingB = b.average_rating ?? 0;
      return ratingB - ratingA;
    });
  }

  return businessesWithRatings;
}

function parseTeamSizeRange(
  range: string,
): [number | null, number | null] {
  if (range === '< 10') return [null, 9];
  if (range === '10-50') return [10, 50];
  if (range === '50-100') return [50, 100];
  if (range === '100-250') return [100, 250];
  if (range === '250+') return [250, null];
  return [null, null];
}

function parseFoundedYearRange(
  range: string,
): [number | null, number | null] {
  if (range === 'Before 2000') return [null, 1999];
  if (range === '2000-2010') return [2000, 2010];
  if (range === '2010-2020') return [2010, 2020];
  if (range === '2020+') return [2020, null];
  return [null, null];
}

