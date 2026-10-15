import { getDirectoryClient } from '~/lib/supabase/directory-client';

import {
  SITEMAP_PAGE_SIZE,
  absoluteUrl,
  xmlEscape,
  xmlResponse,
} from '~/lib/sitemaps';

export async function GET() {
  const client = getDirectoryClient();
  const results = await Promise.all([
    client.from('businesses').select('id', { count: 'exact', head: true }),
    client
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    client
      .from('directory_pages')
      .select('category_slug', { count: 'exact', head: true }),
  ]);
  if (results.some((r) => r.error))
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '300' },
    });
  const entries = ['/sitemaps/static/0'];
  ['companies', 'categories', 'locations'].forEach((kind, i) => {
    for (
      let page = 0;
      page < Math.ceil((results[i]?.count ?? 0) / SITEMAP_PAGE_SIZE);
      page++
    )
      entries.push(`/sitemaps/${kind}/${page}`);
  });
  return xmlResponse(
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map((path) => `<sitemap><loc>${xmlEscape(absoluteUrl(path))}</loc></sitemap>`).join('')}</sitemapindex>`,
  );
}
