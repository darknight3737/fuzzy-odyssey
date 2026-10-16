import assert from 'node:assert/strict';
import { cp, readFile, realpath, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

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

// OpenNext applies this fix to the server bundle, but its external middleware
// can bundle a separate Next copy. Apply the same AST rule there as well.
const plugin = await realpath(
  'apps/web/node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/module-loading.js',
);
const require = createRequire(plugin);
const { patchCode } = await import(
  pathToFileURL(
    require.resolve('@opennextjs/aws/build/patch/astCodePatcher.js'),
  )
);
const { moduleLoadingSignalRule } = await import(pathToFileURL(plugin));
const middlewarePath = 'apps/web/.open-next/middleware/handler.mjs';
const middleware = patchCode(
  await readFile(middlewarePath, 'utf8'),
  moduleLoadingSignalRule,
);
assert(middleware.includes('__cloudflare-context__'));
assert(middleware.includes('requestStore.moduleLoadingSignal'));
await writeFile(middlewarePath, middleware);
console.log('Scoped middleware module-loading signals to each request');
