'use client';
import { useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { MapPin, Search } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@kit/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@kit/ui/popover';
import { cn } from '@kit/ui/utils';
type Location = {
  id: string;
  name: string;
  slug: string;
  type: 'city' | 'state' | 'country';
};
type LocationFilterProps = {
  locations: Location[];
};
export function LocationFilter({ locations }: LocationFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const selectedLocationSlug = searchParams.get('location') || '';
  const selectedLocation = locations.find(
    (loc) => loc.slug === selectedLocationSlug,
  );
  // Filter locations: show results only after 3+ characters (per requirement)
  // Match on both name and slug for better search experience
  const filteredLocations = useMemo(() => {
    const trimmedSearch = searchValue.trim().toLowerCase();
    // Show no results if less than 3 characters (per requirement: "after 3 chars typed, it should display options")
    if (trimmedSearch.length < 3) {
      return [];
    }
    // Filter locations matching search term (name or slug)
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(trimmedSearch) ||
        location.slug.toLowerCase().includes(trimmedSearch),
    );
  }, [locations, searchValue]);
  const handleSelectLocation = (locationSlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (locationSlug === selectedLocationSlug) {
      params.delete('location');
    } else {
      params.set('location', locationSlug);
      // If this is a suggestion (not in DB yet), the location will be created
      // on-demand when the page loads or when a business is assigned
      // No need to pre-create here - lazy loading handles it
    }
    router.push(`?${params.toString()}`);
    setOpen(false);
    setSearchValue('');
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-[240px] justify-between',
              selectedLocation && 'border-primary',
            )}
          />
        }
      >
        <div className={'flex items-center gap-2'}>
          <MapPin className={'text-muted-foreground h-4 w-4'} />
          <span className={'truncate'}>
            {selectedLocation ? selectedLocation.name : 'Search location'}
          </span>
        </div>
        <Search className={'ml-2 h-4 w-4 shrink-0 opacity-50'} />
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search location..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredLocations.length === 0 ? (
              <CommandEmpty>
                {searchValue.trim().length < 3 && searchValue.trim().length > 0
                  ? 'Type at least 3 characters...'
                  : 'No location found.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredLocations.map((location) => (
                  <CommandItem
                    key={location.id}
                    value={`${location.name} ${location.slug}`}
                    onSelect={() => handleSelectLocation(location.slug)}
                  >
                    <div className={'flex items-center gap-2'}>
                      <MapPin className={'text-muted-foreground h-4 w-4'} />
                      <span>{location.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
