import cache from '../../apps/web/cloudflare/incremental-cache.ts';

import assert from 'node:assert/strict';

const entries = new Map();
let assetReads = 0;
const contextKey = Symbol.for('__cloudflare-context__');
const previousContext = globalThis[contextKey];
globalThis[contextKey] = {
  env: {
    NEXT_INC_CACHE_KV: {
      async get(key) {
        return entries.has(key) ? JSON.parse(entries.get(key)) : null;
      },
      async put(key, value) {
        entries.set(key, value);
      },
    },
    ASSETS: {
      async fetch() {
        assetReads += 1;
        return Response.json({ type: 'route', body: 'build-time content' });
      },
    },
  },
};
try {
  assert.equal((await cache.get('/page'))?.value.body, 'build-time content');
  await cache.set('/page', { type: 'route', body: 'updated content' });
  assert.equal((await cache.get('/page'))?.value.body, 'updated content');
  await cache.delete('/page');
  assert.equal(await cache.get('/page'), null);
  assert.equal(
    assetReads,
    1,
    'Deleted data must not fall back to old build assets',
  );
  await cache.set('/page', { type: 'route', body: 'content after eviction' });
  assert.equal(
    (await cache.get('/page'))?.value.body,
    'content after eviction',
  );
  assert.equal(await cache.get('/composable-entry', 'composable'), null);
  assert.equal(
    assetReads,
    1,
    'Composable entries must not query the static cache',
  );
  console.log(
    'Cache bootstrap, updates, eviction and composable misses verified',
  );
} finally {
  if (previousContext) globalThis[contextKey] = previousContext;
  else delete globalThis[contextKey];
}
