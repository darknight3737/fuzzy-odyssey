import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

import incrementalCache from './cloudflare/incremental-cache';

const config = defineCloudflareConfig({
  incrementalCache,
  tagCache: doShardedTagCache({ baseShardSize: 4 }),
  queue: doQueue,
  // Cache Components streams a partial shell; interception would bypass it.
  enableCacheInterception: false,
});

config.buildCommand =
  'node ../../.github/scripts/build-selletive-cloudflare.mjs';

export default config;
