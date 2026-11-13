'use client';

import { useState } from 'react';

import { ChevronRight, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@kit/ui/button';
import { FormControl } from '@kit/ui/form';
import { Input } from '@kit/ui/input';

export type OfferingCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  aliases: string[];
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  searchRef,
  onBlur,
}: {
  categories: OfferingCategory[];
  value: string[];
  onChange: (value: string[]) => void;
  searchRef: React.Ref<HTMLInputElement>;
  onBlur: () => void;
}) {
  const t = useTranslations('offering');
  const [query, setQuery] = useState('');
  const byId = new Map(categories.map((category) => [category.id, category]));
  const children = new Map<string | null, OfferingCategory[]>();

  for (const category of categories) {
    const parent =
      category.parent_id && byId.has(category.parent_id)
        ? category.parent_id
        : null;
    const group = children.get(parent);
    if (group) group.push(category);
    else children.set(parent, [category]);
  }

  function ancestors(category: OfferingCategory) {
    const path: string[] = [];
    const seen = new Set([category.id]);
    let parent = category.parent_id;

    while (parent && !seen.has(parent)) {
      const node = byId.get(parent);
      if (!node) break;
      seen.add(parent);
      path.unshift(node.name);
      parent = node.parent_id;
    }

    return path.join(' › ');
  }

  const terms = normalize(query).split(' ').filter(Boolean);
  const matches = terms.length
    ? categories.filter((category) =>
        [category.name, category.slug, ...category.aliases].some((label) => {
          const text = normalize(label);
          return terms.every((term) => text.includes(term));
        }),
      )
    : [];

  function option(category: OfferingCategory, path?: string) {
    const checked = value.includes(category.id);
    return (
      <label className="hover:bg-muted/60 flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50">
        <input
          type="checkbox"
          checked={checked}
          disabled={!checked && value.length >= 10}
          className="accent-primary size-4 shrink-0"
          data-test={`offering-category-${category.id}`}
          onChange={() =>
            onChange(
              checked
                ? value.filter((id) => id !== category.id)
                : [...value, category.id],
            )
          }
        />
        <span className="min-w-0 break-words">
          {category.name}
          {path && (
            <span className="text-muted-foreground block text-xs">{path}</span>
          )}
        </span>
      </label>
    );
  }

  function branch(category: OfferingCategory): React.ReactNode {
    const descendants = children.get(category.id);
    if (!descendants?.length)
      return <li key={category.id}>{option(category)}</li>;

    return (
      <li key={category.id}>
        <details className="group rounded-lg border">
          <summary
            className="hover:bg-muted/60 flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden"
            data-test={`offering-group-${category.id}`}
          >
            <ChevronRight
              aria-hidden
              className="size-4 shrink-0 group-open:rotate-90"
            />
            {category.name}
          </summary>
          <div className="space-y-1 px-2 pb-2">
            {option(category, t('entireCategory'))}
            <ul className="space-y-1 border-s pl-2">
              {descendants.map(branch)}
            </ul>
          </div>
        </details>
      </li>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute start-3 top-3 size-4"
        />
        <FormControl
          render={
            <Input
              ref={searchRef}
              type="search"
              className="h-10 ps-9"
              data-test="offering-category-search"
              value={query}
              placeholder={t('categoryPlaceholder')}
              onBlur={onBlur}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
              }}
            />
          }
        />
      </div>
      <p role="status" className="text-muted-foreground text-sm">
        {t('categoryCount', { count: value.length })}
        {value.length === 10 && ` · ${t('categoriesLimit')}`}
      </p>
      {!!value.length && (
        <ul
          aria-label={t('selectedCategories')}
          className="flex flex-wrap gap-2"
        >
          {value.map((id) => (
            <li key={id}>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-auto min-h-9 whitespace-normal"
                data-test={`offering-remove-${id}`}
                aria-label={t('removeCategory', {
                  name: byId.get(id)?.name ?? id,
                })}
                onClick={() =>
                  onChange(value.filter((selected) => selected !== id))
                }
              >
                {byId.get(id)?.name}
                <X aria-hidden className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {terms.length ? (
        matches.length ? (
          <ul
            aria-label={t('categoryResults')}
            className="max-h-80 overflow-y-auto rounded-lg border p-1"
          >
            {matches.map((category) => (
              <li key={category.id}>{option(category, ancestors(category))}</li>
            ))}
          </ul>
        ) : (
          <p
            role="status"
            className="text-muted-foreground rounded-lg border p-4 text-sm"
          >
            {t('noCategoriesMatch')}
          </p>
        )
      ) : categories.length ? (
        <ul
          aria-label={t('browseCategories')}
          className="max-h-80 space-y-2 overflow-y-auto p-1"
        >
          {children.get(null)?.map(branch)}
        </ul>
      ) : (
        <p role="status" className="text-muted-foreground text-sm">
          {t('noCategories')}
        </p>
      )}
    </div>
  );
}
