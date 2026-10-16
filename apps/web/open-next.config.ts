import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

const config = defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  tagCache: doShardedTagCache({ baseShardSize: 4 }),
  queue: doQueue,
  // Cache Components streams a partial shell; interception would bypass it.
  enableCacheInterception: false,
});

config.buildCommand = 'pnpm exec next build --webpack';

export default config;
