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
