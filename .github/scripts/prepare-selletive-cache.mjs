import { cp } from 'node:fs/promises';

// Cloudflare reserves cdn-cgi paths: these cache assets are only available
// through the Worker's ASSETS binding, never as public cache JSON downloads.
await cp(
  'apps/web/.open-next/cache',
  'apps/web/.open-next/assets/cdn-cgi/_next_cache',
  { recursive: true },
);
console.log('Prepared deployment-local prerender cache assets');

// Workers exposes additional text modules in its read-only /bundle filesystem.
// Keep the repository CMS available on cold reads, independently of KV expiry.
await cp('apps/web/content', 'apps/web/.open-next/content', {
  recursive: true,
});
console.log('Prepared read-only Keystatic content modules');
