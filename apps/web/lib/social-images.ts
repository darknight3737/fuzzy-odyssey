import appConfig from '~/config/app.config';

export function socialImageUrl(
  kind: 'company' | 'category' | 'site',
  slug: string,
  version: string | null = '1',
) {
  const url = new URL(`/api/og/${kind}/${encodeURIComponent(slug)}`, appConfig.url);
  url.searchParams.set('v', version ?? '1');
  return url.href;
}

export function socialImageMetadata(url: string, alt: string) {
  return { url, width: 1200, height: 630, alt };
}
