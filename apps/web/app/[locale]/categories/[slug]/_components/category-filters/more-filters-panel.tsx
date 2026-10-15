'use client';

import { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { X } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Checkbox } from '@kit/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@kit/ui/sheet';

const LANGUAGES = [
  'English',
  'Portuguese',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Dutch',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Russian',
  'Turkish',
  'Polish',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish',
  'Greek',
];

const TEAM_SIZE_OPTIONS = ['< 10', '10-50', '50-100', '100-250', '250+'];

const FOUNDED_YEAR_OPTIONS = ['Before 2000', '2000-2010', '2010-2020', '2020+'];

type MoreFiltersPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MoreFiltersPanel({
  open,
  onOpenChange,
}: MoreFiltersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [languages, setLanguages] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState<string>('');
  const [worksRemotely, setWorksRemotely] = useState<boolean>(false);
  const [foundedYear, setFoundedYear] = useState<string>('');

  useEffect(() => {
    // Sync state with URL params
    const languagesParam = searchParams.get('languages');
    setLanguages(languagesParam ? languagesParam.split(',') : []);

    setTeamSize(searchParams.get('teamSize') || '');
    setWorksRemotely(searchParams.get('worksRemotely') === 'true');
    setFoundedYear(searchParams.get('foundedYear') || '');
  }, [searchParams]);

  const toggleLanguage = (language: string) => {
    setLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language],
    );
  };

  const activeFilterCount =
    languages.length +
    (teamSize ? 1 : 0) +
    (worksRemotely ? 1 : 0) +
    (foundedYear ? 1 : 0);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Update languages
    if (languages.length > 0) {
      params.set('languages', languages.join(','));
    } else {
      params.delete('languages');
    }

    // Update team size
    if (teamSize) {
      params.set('teamSize', teamSize);
    } else {
      params.delete('teamSize');
    }

    // Update works remotely
    if (worksRemotely) {
      params.set('worksRemotely', 'true');
    } else {
      params.delete('worksRemotely');
    }

    // Update founded year
    if (foundedYear) {
      params.set('foundedYear', foundedYear);
    } else {
      params.delete('foundedYear');
    }

    router.push(`?${params.toString()}`);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    setLanguages([]);
    setTeamSize('');
    setWorksRemotely(false);
    setFoundedYear('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[500px]">
        <SheetHeader>
          <div className={'flex items-center justify-between'}>
            <SheetTitle>Filters</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className={'h-6 w-6'}
            >
              <X className={'h-4 w-4'} />
            </Button>
          </div>
          <SheetDescription>
            Refine your search with additional filters
          </SheetDescription>
        </SheetHeader>

        <div className={'mt-6 space-y-8'}>
          {/* Languages */}
          <div>
            <div className={'mb-4 flex items-center justify-between'}>
              <h3 className={'font-semibold'}>
                Languages ({languages.length})
              </h3>
            </div>
            <div className={'flex flex-wrap gap-2'}>
              {LANGUAGES.map((language) => (
                <Button
                  key={language}
                  variant={languages.includes(language) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleLanguage(language)}
                >
                  {language}
                </Button>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div>
            <div className={'mb-4 flex items-center justify-between'}>
              <h3 className={'font-semibold'}>Ratings (0)</h3>
            </div>
            <div className={'flex flex-wrap gap-2'}>
              {['1+', '2+', '3+', '4+', '5'].map((rating) => (
                <Button
                  key={rating}
                  variant="outline"
                  size="sm"
                  className={'text-muted-foreground'}
                >
                  ☆ {rating}
                </Button>
              ))}
            </div>
            <p className={'text-muted-foreground mt-2 text-sm'}>
              Note: Rating filter is available in the main filter bar
            </p>
          </div>

          {/* Team Size */}
          <div>
            <div className={'mb-4 flex items-center justify-between'}>
              <h3 className={'font-semibold'}>
                Team size ({teamSize ? 1 : 0})
              </h3>
            </div>
            <div className={'flex flex-wrap gap-2'}>
              {TEAM_SIZE_OPTIONS.map((size) => (
                <Button
                  key={size}
                  variant={teamSize === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTeamSize(teamSize === size ? '' : size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Works Remotely */}
          <div>
            <div className={'mb-4 flex items-center justify-between'}>
              <h3 className={'font-semibold'}>
                Works Remotely ({worksRemotely ? 1 : 0})
              </h3>
            </div>
            <div className={'flex items-center space-x-2'}>
              <Checkbox
                id="works-remotely"
                checked={worksRemotely}
                onCheckedChange={(checked) =>
                  setWorksRemotely(checked === true)
                }
              />
              <label
                htmlFor="works-remotely"
                className={
                  'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                }
              >
                Remote work available
              </label>
            </div>
          </div>

          {/* Founded Year */}
          <div>
            <div className={'mb-4 flex items-center justify-between'}>
              <h3 className={'font-semibold'}>
                Founded Year ({foundedYear ? 1 : 0})
              </h3>
            </div>
            <div className={'flex flex-wrap gap-2'}>
              {FOUNDED_YEAR_OPTIONS.map((year) => (
                <Button
                  key={year}
                  variant={foundedYear === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setFoundedYear(foundedYear === year ? '' : year)
                  }
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className={'mt-8 flex gap-4 border-t pt-6'}>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className={'flex-1'}
          >
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} className={'flex-1'}>
            Apply filters ({activeFilterCount})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
