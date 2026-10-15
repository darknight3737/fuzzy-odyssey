import type { Metadata } from 'next';

import appConfig from '~/config/app.config';

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  index = true,
): Metadata {
  const url = new URL(path, appConfig.url).href;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index, follow: true },
    openGraph: { title, description, url, type: 'website', locale: 'pt_BR' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// Escaping prevents database content from closing a JSON-LD script element.
export function serializeJsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function safeWebsite(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
