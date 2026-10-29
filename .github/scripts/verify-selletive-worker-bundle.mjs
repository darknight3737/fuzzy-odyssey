import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const bundle = await readFile(join(process.argv[2], 'worker.js'), 'utf8');
const signals = [
  ...bundle.matchAll(
    /function getModuleLoadingSignal\(\)\s*\{([\s\S]*?)\n\s*\}/g,
  ),
];
assert(signals.length, 'Missing Next module-loading signal implementation');
for (const [, implementation] of signals) {
  assert.match(implementation, /requestStore/);
  assert.match(implementation, /__openNextAls/);
  assert.match(implementation, /CacheSignal\(null\)/);
}
console.log('Bundled module-loading signals are scoped to each request');
for (const name of [
  'crossRequestPendingCacheInvocations',
  'backgroundRevalidations',
]) {
  assert.match(bundle, new RegExp(`function getSelletive_${name}\\(`));
  assert.match(bundle, new RegExp(`store\\.selletiveFallback_${name}`));
  assert(!new RegExp(`(?:const|let|var)\\s+${name}\\d*\\s*=\\s*new Map\\(`).test(bundle));
  assert(!new RegExp(`\\b${name}\\d*\\.(?:get|set|has|delete)\\(`).test(bundle));
}
console.log('Bundled pending cache streams are scoped to each request');
