import { describe, expect, it } from 'vitest';

import { createContentItemComparator } from './sort-content-items';

function item(
  title: string,
  overrides: { publishedAt?: string | null; order?: number | null } = {},
) {
  return {
    entry: {
      title,
      publishedAt: overrides.publishedAt ?? null,
      order: overrides.order ?? null,
    },
  };
}

const titles = (items: ReturnType<typeof item>[]) =>
  items.map((entry) => entry.entry.title);

describe('createContentItemComparator', () => {
  it('sorts by publishedAt ascending by default', () => {
    const items = [
      item('b', { publishedAt: '2024-02-01' }),
      item('a', { publishedAt: '2024-01-01' }),
      item('c', { publishedAt: '2024-03-01' }),
    ];

    items.sort(createContentItemComparator({}));

    expect(titles(items)).toEqual(['a', 'b', 'c']);
  });

  it('honours sortDirection desc', () => {
    const items = [
      item('a', { publishedAt: '2024-01-01' }),
      item('c', { publishedAt: '2024-03-01' }),
      item('b', { publishedAt: '2024-02-01' }),
    ];

    items.sort(
      createContentItemComparator({
        sortBy: 'publishedAt',
        sortDirection: 'desc',
      }),
    );

    expect(titles(items)).toEqual(['c', 'b', 'a']);
  });

  it('sorts by title alphabetically instead of coercing to a date', () => {
    const items = [item('Zebra'), item('apple'), item('Mango')];

    items.sort(createContentItemComparator({ sortBy: 'title' }));

    expect(titles(items)).toEqual(['apple', 'Mango', 'Zebra']);
  });

  it('sorts by title descending', () => {
    const items = [item('apple'), item('Zebra'), item('Mango')];

    items.sort(
      createContentItemComparator({ sortBy: 'title', sortDirection: 'desc' }),
    );

    expect(titles(items)).toEqual(['Zebra', 'Mango', 'apple']);
  });

  it('sorts by order ascending by default when sortBy is order', () => {
    const items = [
      item('second', { order: 2 }),
      item('third', { order: 3 }),
      item('first', { order: 1 }),
    ];

    items.sort(createContentItemComparator({ sortBy: 'order' }));

    expect(titles(items)).toEqual(['first', 'second', 'third']);
  });

  it('sorts by order and honours direction when sortBy is order', () => {
    const items = [
      item('second', { order: 2 }),
      item('first', { order: 1 }),
      item('third', { order: 3 }),
    ];

    items.sort(
      createContentItemComparator({ sortBy: 'order', sortDirection: 'desc' }),
    );

    expect(titles(items)).toEqual(['third', 'second', 'first']);
  });

  it('ignores order when the caller asks for publishedAt', () => {
    const items = [
      item('ordered-old', { publishedAt: '2024-01-01', order: 1 }),
      item('newest', { publishedAt: '2024-03-01' }),
      item('middle', { publishedAt: '2024-02-01' }),
    ];

    items.sort(
      createContentItemComparator({
        sortBy: 'publishedAt',
        sortDirection: 'desc',
      }),
    );

    expect(titles(items)).toEqual(['newest', 'middle', 'ordered-old']);
  });

  it('ranks by order then publishedAt when no sortBy is given', () => {
    const items = [
      item('unordered-newest', { publishedAt: '2024-03-01' }),
      item('ordered-last', { publishedAt: '2024-01-01', order: 2 }),
      item('ordered-first', { publishedAt: '2024-02-01', order: 1 }),
      item('unordered-oldest', { publishedAt: '2024-01-15' }),
    ];

    items.sort(createContentItemComparator({}));

    expect(titles(items)).toEqual([
      'unordered-oldest',
      'unordered-newest',
      'ordered-first',
      'ordered-last',
    ]);
  });

  it('treats a missing or invalid publishedAt as the epoch', () => {
    const items = [
      item('valid', { publishedAt: '2024-01-01' }),
      item('missing', { publishedAt: null }),
      item('invalid', { publishedAt: 'not-a-date' }),
    ];

    items.sort(createContentItemComparator({ sortDirection: 'desc' }));

    expect(titles(items)).toEqual(['valid', 'missing', 'invalid']);
  });
});
