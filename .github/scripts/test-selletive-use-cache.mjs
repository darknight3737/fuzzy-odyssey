import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

import { patchUseCache } from './patch-selletive-use-cache.mjs';

const source = await readFile(
  'apps/web/node_modules/next/dist/server/use-cache/use-cache-wrapper.js',
  'utf8',
);
const patched = patchUseCache(source);
let store;
const globals = { __openNextAls: { getStore: () => store } };
for (const name of [
  'crossRequestPendingCacheInvocations',
  'backgroundRevalidations',
]) {
  // Extract the actual declarations and call sites from the installed Next
  // implementation. The unpatched module leaks the first request's unresolved
  // promise into the next request, reproducing the poisoned-isolate condition.
  const original = source.match(new RegExp(`const ${name} = new Map\\(\\);`))[0];
  const declaration = patched.match(
    new RegExp(`const selletiveFallback_${name} = new Map\\(\\);[\\s\\S]*?\\n}`),
  )[0];
  const getter = `getSelletive_${name}()`;
  const keyArgument = 'cacheHandlerKey';
  assert(source.includes(`${name}.get(${keyArgument})`));
  assert(patched.includes(`${getter}.get(${keyArgument})`));
  function probe(code, map) {
    return runInNewContext(
      `${code}\n({get: key => ${map}.get(key), set: (key, value) => ${map}.set(key, value)})`,
      { globalThis: globals },
    );
  }
  const baseline = probe(original, name);
  const fixed = probe(declaration, getter);
  const pending = new Promise(() => {});
  const first = {};
  store = first;
  baseline.set('page', pending);
  fixed.set('page', pending);
  assert.equal(fixed.get('page'), pending, 'Same-request dedupe must work');
  store = {};
  assert.equal(baseline.get('page'), pending, 'Baseline must reproduce sharing');
  assert.equal(fixed.get('page'), undefined, 'New request must not join old I/O');
  fixed.set('page', 'second');
  store = first;
  assert.equal(fixed.get('page'), pending, 'Interleaved requests stay isolated');
}
console.log('Next pending cache fills and revalidations isolate requests');
