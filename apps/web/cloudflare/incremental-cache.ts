import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Seed prerendered shells from the deployment's private assets. Runtime updates
// still go to KV, so revalidation never writes to the immutable asset bundle.
const cache: Pick<typeof kvIncrementalCache, 'get' | 'set' | 'delete'> & {
  name: string;
} = {
  name: 'selletive-kv-with-build-assets',
  async get(key, cacheType) {
    const cached = await kvIncrementalCache.get(key, cacheType);
    if (cached || cacheType === 'composable') return cached;

    return staticAssetsIncrementalCache.get(key, cacheType);
  },
  set: kvIncrementalCache.set.bind(kvIncrementalCache),
  delete: kvIncrementalCache.delete.bind(kvIncrementalCache),
};

export default cache;
