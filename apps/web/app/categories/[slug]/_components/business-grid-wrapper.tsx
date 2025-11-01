'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { BusinessGrid } from './business-grid';
import { BusinessGridSkeleton } from './business-grid-skeleton';

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  tier: string;
  average_rating: number | null;
  review_count: number;
  business_locations?: Array<{
    locations: {
      name: string;
      slug: string;
    } | null;
  }>;
};

type BusinessGridWrapperProps = {
  businesses: Business[];
};

export function BusinessGridWrapper({ businesses }: BusinessGridWrapperProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [displayBusinesses, setDisplayBusinesses] = useState(businesses);
  const [previousParams, setPreviousParams] = useState<string>(
    searchParams.toString(),
  );

  useEffect(() => {
    const currentParams = searchParams.toString();
    
    // Detect if search params changed (filter applied)
    if (currentParams !== previousParams) {
      setPreviousParams(currentParams);
      
      // Use transition to show loading state
      startTransition(() => {
        setDisplayBusinesses(businesses);
      });
    } else {
      // Same params but businesses might have changed (initial load)
      setDisplayBusinesses(businesses);
    }
  }, [searchParams, businesses, previousParams]);

  // Show skeleton during pending state
  if (isPending) {
    return <BusinessGridSkeleton />;
  }

  return <BusinessGrid businesses={displayBusinesses} />;
}

