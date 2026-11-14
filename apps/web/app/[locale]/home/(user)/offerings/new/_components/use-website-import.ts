'use client';

import { useEffect, useRef, useState } from 'react';

import type { UseFormReturn } from 'react-hook-form';

import {
  type OfferingInput,
  OfferingWebsiteSchema,
} from '~/lib/offerings/schema';

type Status = 'loading' | 'imported' | 'unavailable' | 'untouched';

function getPublicPage(website: string) {
  const result = OfferingWebsiteSchema.safeParse(website);
  if (!result.success) return null;
  const { origin, pathname } = new URL(result.data);
  return origin + pathname;
}

export function useWebsiteImport(
  website: string,
  enabled: boolean,
  { getValues, setValue }: UseFormReturn<OfferingInput>,
) {
  const pageUrl = getPublicPage(website);
  const [result, setResult] = useState<{ pageUrl: string; status: Status }>();
  const [attempt, setAttempt] = useState(0);
  const edited = useRef(new Set<'name' | 'description'>());
  const completed = useRef<string | null>(null);
  const imported = useRef<Partial<Record<'name' | 'description', string>>>({});

  // The lookup is tied to the visible step and the current pageUrl. Cleanup
  // cancels both the debounce and any request when either changes.
  useEffect(() => {
    if (!enabled || !pageUrl || completed.current === pageUrl) return;
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setResult({ pageUrl, status: 'loading' });

      try {
        const params = new URLSearchParams({ website: pageUrl });
        const response = await fetch(`/api/offerings/website?${params}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Website metadata unavailable');
        const data: { name: string; description: string } =
          await response.json();
        if (
          controller.signal.aborted ||
          getPublicPage(getValues('website')) !== pageUrl
        )
          return;

        let filled = false;
        for (const field of ['name', 'description'] as const) {
          const current = getValues(field);
          const next = data[field];
          if (
            !edited.current.has(field) &&
            (!current.trim() || current === imported.current[field]) &&
            next
          ) {
            setValue(field, next, { shouldValidate: true });
            imported.current[field] = next;
            filled = true;
          }
        }

        completed.current = pageUrl;
        setResult({
          pageUrl,
          status: filled
            ? 'imported'
            : data.name || data.description
              ? 'untouched'
              : 'unavailable',
        });
      } catch {
        if (!controller.signal.aborted) {
          completed.current = pageUrl;
          setResult({ pageUrl, status: 'unavailable' });
        }
      }
    }, 900);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [attempt, enabled, getValues, pageUrl, setValue]);

  function updateWebsite(next: string) {
    if (getPublicPage(next) === pageUrl) return;
    // Discard suggestions from the old site, but keep anything the user edited.
    for (const field of ['name', 'description'] as const) {
      if (getValues(field) === imported.current[field]) setValue(field, '');
    }
    imported.current = {};
    completed.current = null;
    setResult(undefined);
  }

  return {
    status: result?.pageUrl === pageUrl ? result?.status : undefined,
    updateWebsite,
    markEdited(field: 'name' | 'description') {
      edited.current.add(field);
      delete imported.current[field];
    },
    retry() {
      completed.current = null;
      setResult(undefined);
      setAttempt((value) => value + 1);
    },
  };
}
