import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

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
const source = await readFile(
  'apps/web/node_modules/next/dist/server/app-render/module-loading/track-module-loading.instance.js',
  'utf8',
);
const patched = patchCode(source, moduleLoadingSignalRule);
assert.notEqual(patched, source, 'Adapter did not match installed Next.js');

let requestStore;
let cloudflareStore;
const exports = {};
class CacheSignal {
  constructor(tracker) {
    assert.equal(tracker, null, 'Next constructor argument must be retained');
    this.reads = 0;
  }
  trackRead() {
    this.reads++;
  }
}
const globals = { __openNextAls: { getStore: () => requestStore } };
Object.defineProperty(globals, Symbol.for('__cloudflare-context__'), {
  get: () => cloudflareStore,
});
runInNewContext(patched, {
  exports,
  require: () => ({ CacheSignal }),
  Promise,
  globalThis: globals,
});
const first = {};
const second = {};
requestStore = first;
exports.trackPendingImport(Promise.resolve());
exports.trackPendingImport(Promise.resolve());
requestStore = second;
exports.trackPendingImport(Promise.resolve());
assert.notEqual(first.moduleLoadingSignal, second.moduleLoadingSignal);
assert.equal(first.moduleLoadingSignal.reads, 2);
assert.equal(second.moduleLoadingSignal.reads, 1);
requestStore = undefined;
cloudflareStore = {};
const middlewareFirst = cloudflareStore;
exports.trackPendingImport(Promise.resolve());
cloudflareStore = {};
exports.trackPendingImport(Promise.resolve());
assert.notEqual(
  middlewareFirst.moduleLoadingSignal,
  cloudflareStore.moduleLoadingSignal,
);
assert.equal(middlewareFirst.moduleLoadingSignal.reads, 1);
assert.equal(cloudflareStore.moduleLoadingSignal.reads, 1);
console.log('Installed Next.js module-loading signals isolate requests');
