import 'server-only';
import { notFound } from 'next/navigation';

/**
 * Params for a `page/[page]` route. Page 1 is the collection index, so these
 * start at page 2. `ensureStatic` requires at least one param: with a single
 * page of content, page 2 is prerendered as a 404.
 */
export function getPaginatedStaticParams(pageCount: number) {
  const lastPage = Math.max(pageCount, 2);

  return Array.from({ length: lastPage - 1 }, (_, index) => ({
    page: String(index + 2),
  }));
}

/**
 * Only canonical page numbers from 2 up: `page/1` and `page/02` would
 * duplicate other URLs.
 */
export function parsePaginatedPage(value: string) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 2 || String(page) !== value) {
    notFound();
  }

  return page;
}

export function paginate<Item>(
  result: { items: Item[]; total: number },
  page: number,
  perPage: number,
) {
  if (page > 1 && result.items.length === 0) {
    notFound();
  }

  return {
    items: result.items,
    hasPreviousPage: page > 1,
    hasNextPage: page * perPage < result.total,
  };
}
