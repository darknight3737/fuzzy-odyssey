import 'server-only';
import * as z from 'zod';

import { badgeLink, verificationDomain } from './schema';

const dnsResponse = z.object({
  Status: z.number(),
  Answer: z
    .array(z.object({ name: z.string(), type: z.number(), data: z.string() }))
    .optional(),
});

export async function checkDns(domain: string, token: string) {
  const name = `_selletive-verification.${domain}`;
  const endpoint = new URL('https://cloudflare-dns.com/dns-query');
  endpoint.search = new URLSearchParams({ name, type: 'TXT' }).toString();
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/dns-json' },
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) return false;
  const data = dnsResponse.safeParse(await response.json());
  return (
    data.success &&
    data.data.Status === 0 &&
    !!data.data.Answer?.some(
      (record) =>
        record.type === 16 &&
        record.name.toLowerCase().replace(/\.$/, '') === name &&
        record.data.replace(/^"|"$/g, '') === `selletive=${token}`,
    )
  );
}

const badgeResponse = z.object({
  status: z.literal('success'),
  statusCode: z.number(),
  data: z.object({ url: z.string(), badge: z.string().nullish() }),
});

export async function checkBadge(page: string, domain: string, token: string) {
  if (verificationDomain(page) !== domain) return false;
  const url = new URL(page);
  // Only check public HTTPS pages. Never forward query parameters or fragments.
  if (url.protocol !== 'https:') return false;
  const key = process.env.MICROLINK_API_KEY;
  const endpoint = new URL(
    key ? 'https://pro.microlink.io/' : 'https://api.microlink.io/',
  );
  const href = badgeLink(token);
  endpoint.search = new URLSearchParams({
    url: url.origin + url.pathname,
    'data.badge.selector': `a[data-selletive-badge="v1"][href="${href}"]`,
    'data.badge.attr': 'href',
    'data.badge.type': 'string',
  }).toString();
  const response = await fetch(endpoint, {
    headers: key ? { 'x-api-key': key } : undefined,
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return false;
  const result = badgeResponse.safeParse(await response.json());
  return (
    result.success &&
    result.data.statusCode === 200 &&
    verificationDomain(result.data.data.url) === domain &&
    new URL(result.data.data.url).protocol === 'https:' &&
    result.data.data.badge === href
  );
}
