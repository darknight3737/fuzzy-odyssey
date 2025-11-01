'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Plus } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { LocationFilter } from './location-filter';
import { MoreFiltersPanel } from './more-filters-panel';
import { RatingFilter } from './rating-filter';

type Location = {
  id: string;
  name: string;
  slug: string;
  type: 'city' | 'state' | 'country';
};

type FilterBarProps = {
  businessCount: number;
  locations: Location[];
  currentSort?: string;
};

export function FilterBar({
  businessCount,
  locations,
  currentSort = 'relevancy',
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  // Count active advanced filters
  const languages = searchParams.get('languages');
  const teamSize = searchParams.get('teamSize');
  const worksRemotely = searchParams.get('worksRemotely');
  const foundedYear = searchParams.get('foundedYear');

  const advancedFilterCount =
    (languages ? languages.split(',').length : 0) +
    (teamSize ? 1 : 0) +
    (worksRemotely ? 1 : 0) +
    (foundedYear ? 1 : 0);

  return (
    <>
      <div className={'mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'}>
        {/* Left side: Filters */}
        <div className={'flex flex-wrap items-center gap-3'}>
          <LocationFilter locations={locations} />
          <RatingFilter />
          <Button
            variant="outline"
            onClick={() => setMoreFiltersOpen(true)}
            className={advancedFilterCount > 0 ? 'border-primary' : ''}
          >
            <Plus className={'mr-2 h-4 w-4'} />
            More filters
            {advancedFilterCount > 0 && (
              <Badge
                variant="secondary"
                className={'ml-2 h-5 min-w-[20px] px-1.5'}
              >
                {advancedFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Right side: Count and Sort */}
        <div className={'flex items-center gap-4'}>
          <span className={'text-sm text-muted-foreground'}>
            {businessCount} {businessCount === 1 ? 'agency' : 'agencies'}
          </span>
          <Select
            value={currentSort}
            onValueChange={(sort) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('sort', sort);
              router.push(`?${params.toString()}`);
            }}
          >
            <SelectTrigger className={'w-[160px]'}>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevancy">Sort by: Relevancy</SelectItem>
              <SelectItem value="rating">Sort by: Rating</SelectItem>
              <SelectItem value="name">Sort by: Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <MoreFiltersPanel
        open={moreFiltersOpen}
        onOpenChange={setMoreFiltersOpen}
      />
    </>
  );
}

