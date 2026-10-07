export const BLOG_POSTS_PER_PAGE = 10;

/**
 * Pages are 1-based. Page 1 is the `/blog` index itself; later pages live under
 * `/blog/page/[page]` so every page can be prerendered.
 */
export function getBlogPagePath(page: number) {
  return page > 1 ? `/blog/page/${page}` : '/blog';
}
