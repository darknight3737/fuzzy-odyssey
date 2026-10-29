import assert from 'node:assert/strict';
import { glob, readFile, writeFile } from 'node:fs/promises';

export function patchModuleLoading(source) {
  const implementation = /function getModuleLoadingSignal\(\) \{\n    if \(!_moduleLoadingSignal\) \{\n        _moduleLoadingSignal = new ((?:_cachesignal\.)?CacheSignal)\(null\);\n    \}\n    return _moduleLoadingSignal;\n\}/;
  assert(implementation.test(source), 'Next module-loading implementation changed');
  return source.replace(implementation, (_, constructor) => `function getModuleLoadingSignal() {
    const requestStore = globalThis.__openNextAls?.getStore()
      ?? globalThis[Symbol.for("__cloudflare-context__")];
    if (requestStore) {
      return requestStore.moduleLoadingSignal ??= new ${constructor}(null);
    }
    return _moduleLoadingSignal ??= new ${constructor}(null);
}`);
}

// Next 16.4 shares pending streams between requests. A Worker request must not
// await I/O owned by a finished request. Keep persisted cache entries shared,
// but scope both in-flight maps to the same request store as module loading.
export function patchUseCache(source) {
  if (source.includes('function getSelletive_crossRequestPendingCacheInvocations()')) {
    assert(source.includes('function getSelletive_backgroundRevalidations()'));
    assert(!/\b(?:crossRequestPendingCacheInvocations|backgroundRevalidations)\./.test(source));
    return source;
  }
  for (const name of [
    'crossRequestPendingCacheInvocations',
    'backgroundRevalidations',
  ]) {
    const declaration = `const ${name} = new Map();`;
    assert.equal(source.split(declaration).length, 2, `Next changed: ${name}`);
    const getter = `getSelletive_${name}`;
    const fallback = `selletiveFallback_${name}`;
    source = source.replace(declaration, '__SELLETIVE_MAP_DECLARATION__');
    source = source.replaceAll(new RegExp(`\\b${name}\\b`, 'g'), `${getter}()`);
    source = source.replace(
      '__SELLETIVE_MAP_DECLARATION__',
      `const ${fallback} = new Map();
function ${getter}() {
  const store = globalThis.__openNextAls?.getStore()
    ?? globalThis[Symbol.for("__cloudflare-context__")];
  if (!store) return ${fallback};
  return store.${fallback} ??= new Map();
}`,
    );
  }
  return source;
}

export async function patchStandaloneCache(web) {
  const root = new URL('.next/standalone/', web);
  let count = 0;
  for await (const path of glob(
    'node_modules/.pnpm/next@*/node_modules/next/dist/server/use-cache/use-cache-wrapper.js',
    { cwd: root },
  )) {
    const file = new URL(path, root);
    await writeFile(file, patchUseCache(await readFile(file, 'utf8')));
    count++;
  }
  // Next can embed the complete wrapper in webpack chunks, leaving no separate
  // traced file. Those chunks were compiled from the patched installed source.
  console.log(`Scoped pending use-cache streams in ${count} standalone module(s)`);
}
