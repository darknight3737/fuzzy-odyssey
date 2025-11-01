'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Star } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { cn } from '@kit/ui/utils';

const RATING_OPTIONS = [
  { value: '5', label: '5' },
  { value: '4', label: '4+' },
  { value: '3', label: '3+' },
  { value: '2', label: '2+' },
  { value: '1', label: '1+' },
];

export function RatingFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedRating = searchParams.get('minRating') || '';

  const handleSelectRating = (rating: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (rating === selectedRating) {
      params.delete('minRating');
    } else {
      params.set('minRating', rating);
    }

    router.push(`?${params.toString()}`);
  };

  const selectedLabel = selectedRating
    ? RATING_OPTIONS.find((opt) => opt.value === selectedRating)?.label
    : 'Ratings';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[140px] justify-between',
            selectedRating && 'border-primary',
          )}
        >
          <div className={'flex items-center gap-2'}>
            <Star className={'h-4 w-4 text-muted-foreground'} />
            <span>{selectedLabel}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {RATING_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelectRating(option.value)}
            className={cn(
              selectedRating === option.value && 'bg-accent',
            )}
          >
            <div className={'flex items-center gap-2'}>
              <Star className={'h-4 w-4 text-yellow-500'} />
              <span>{option.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

