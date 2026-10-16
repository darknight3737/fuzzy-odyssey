import assert from 'node:assert/strict';
import { cp, readFile, writeFile } from 'node:fs/promises';

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

// Next 16 captures the global immediate timer pair when its modules load.
// Seed both from the same Node API before any generated Worker dependencies.
const workerPath = 'apps/web/.open-next/worker.js';
const bootstrap = 'import "./cloudflare/selletive-timers.js";\n';
const worker = await readFile(workerPath, 'utf8');
assert(worker.includes('runWithCloudflareRequestContext'));
await writeFile(
  'apps/web/.open-next/cloudflare/selletive-timers.js',
  `import { setImmediate, clearImmediate } from 'node:timers';
globalThis.setImmediate = setImmediate;
globalThis.clearImmediate = clearImmediate;
`,
);
if (!worker.startsWith(bootstrap)) {
  await writeFile(workerPath, bootstrap + worker);
}
console.log('Prepared Node immediate timers before Next initialization');
