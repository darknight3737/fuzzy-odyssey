import type { Cms } from '@kit/cms-types';

type SortableItem = {
  entry: {
    title: string;
    publishedAt: string | null;
    order: number | null;
  };
};

type SortOptions = Pick<Cms.GetContentItemsOptions, 'sortBy' | 'sortDirection'>;

/**
 * @name createContentItemComparator
 * @description Build the comparator used to sort a collection before it is
 * paginated, so the order is consistent across pages.
 *
 * When the caller passes a `sortBy` it is honoured exactly, in the requested
 * `sortDirection` (default `asc`).
 *
 * When no `sortBy` is passed, items are ranked by their explicit `order`
 * first (missing `order` counts as `0`), and by `publishedAt` in the
 * requested `sortDirection` as a tie-breaker. This keeps hand-ordered
 * collections such as documentation in their authored order.
 */
export function createContentItemComparator(options: SortOptions) {
  const direction = options.sortDirection === 'desc' ? -1 : 1;

  switch (options.sortBy) {
    case 'order':
      return (a: SortableItem, b: SortableItem) => direction * byOrder(a, b);

    case 'title':
      return (a: SortableItem, b: SortableItem) => direction * byTitle(a, b);

    case 'publishedAt':
      return (a: SortableItem, b: SortableItem) =>
        direction * byPublishedAt(a, b);

    default:
      return (a: SortableItem, b: SortableItem) =>
        byOrder(a, b) || direction * byPublishedAt(a, b);
  }
}

function byOrder(a: SortableItem, b: SortableItem) {
  return (a.entry.order ?? 0) - (b.entry.order ?? 0);
}

function byPublishedAt(a: SortableItem, b: SortableItem) {
  return toTime(a.entry.publishedAt) - toTime(b.entry.publishedAt);
}

function byTitle(a: SortableItem, b: SortableItem) {
  return a.entry.title.localeCompare(b.entry.title);
}

function toTime(value: string | null) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}
