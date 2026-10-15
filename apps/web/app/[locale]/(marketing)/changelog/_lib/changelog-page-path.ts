export const CHANGELOG_ENTRIES_PER_PAGE = 50;

/**
 * Pages are 1-based. Page 1 is the `/changelog` index itself; later pages live
 * under `/changelog/page/[page]` so every page can be prerendered.
 */
export function getChangelogPagePath(page: number) {
  return page > 1 ? `/changelog/page/${page}` : '/changelog';
}
