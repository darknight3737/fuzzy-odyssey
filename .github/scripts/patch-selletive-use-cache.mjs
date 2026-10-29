import assert from 'node:assert/strict';
import { glob, readFile, writeFile } from 'node:fs/promises';

// Next 16.4 shares pending streams between requests. A Worker request must not
// await I/O owned by a finished request. Keep persisted cache entries shared,
// but scope both in-flight maps to the same request store as module loading.
export function patchUseCache(source) {
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
  assert(count > 0, 'Next standalone use-cache implementation not found');
  console.log(`Scoped pending use-cache streams in ${count} standalone module(s)`);
}
