import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  SITEMAP_PAGE_SIZE,
  absoluteUrl,
  xmlEscape,
  xmlResponse,
} from '~/lib/sitemaps';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; page: string }> },
) {
  const { kind, page } = await params;
  if (!/^(0|[1-9][0-9]{0,5})$/.test(page))
    return new Response('Not found', { status: 404 });
  const pageNumber = Number(page),
    start = pageNumber * SITEMAP_PAGE_SIZE,
    end = start + SITEMAP_PAGE_SIZE - 1;
  const client = getSupabaseServerClient();
  let paths: Array<{ path: string; updated?: string | null }> = [];
  if (kind === 'static' && pageNumber === 0)
    paths = [
      '/',
      '/categories',
      '/faq',
      '/pricing',
      '/contact',
      '/privacy-policy',
      '/terms-of-service',
      '/cookie-policy',
    ].map((path) => ({ path }));
  else if (kind === 'companies' || kind === 'categories') {
    let query = client
      .from(kind === 'companies' ? 'businesses' : 'categories')
      .select('slug,updated_at')
      .order('slug')
      .range(start, end);
    if (kind === 'categories') query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) return new Response('Unavailable', { status: 503 });
    paths = (data ?? []).map((row) => ({
      path: `/${kind === 'companies' ? 'company' : 'categories'}/${row.slug}`,
      updated: row.updated_at,
    }));
  } else if (kind === 'locations') {
    const { data, error } = await client
      .from('directory_pages')
      .select('category_slug,location_slug,updated_at')
      .order('category_slug')
      .order('location_slug')
      .range(start, end);
    if (error) return new Response('Unavailable', { status: 503 });
    paths = (data ?? []).map((row) => ({
      path: `/${row.category_slug}/${row.location_slug}`,
      updated: row.updated_at,
    }));
  } else return new Response('Not found', { status: 404 });
  if (!paths.length) return new Response('Not found', { status: 404 });
  return xmlResponse(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((row) => `<url><loc>${xmlEscape(absoluteUrl(row.path))}</loc>${row.updated ? `<lastmod>${xmlEscape(row.updated)}</lastmod>` : ''}</url>`).join('')}</urlset>`,
  );
}
