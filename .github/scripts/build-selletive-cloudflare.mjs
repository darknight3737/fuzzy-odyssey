import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { patchModuleLoading, patchStandaloneCache, patchUseCache } from './patch-selletive-use-cache.mjs';

assert.equal(process.env.CLOUDFLARE_BUILD, 'true');
const web = new URL('../../apps/web/', import.meta.url);
const assertions = [
  [
    'app/[locale]/(marketing)/layout.tsx',
    "export const ensureStatic = 'navigation';",
  ],
  ['app/[locale]/admin/layout.tsx', 'export const instant = false;'],
];
const patched = [];
let child;
let interrupted;
let killTimer;
const handlers = new Map();
for (const signal of ['SIGINT', 'SIGTERM']) {
  const handler = () => {
    interrupted = signal;
    child?.kill(signal);
    killTimer ??= setTimeout(() => child?.kill('SIGKILL'), 5000).unref();
  };
  handlers.set(signal, handler);
  process.on(signal, handler);
}
try {
  // Next rejects these PPR-only declarations in a full-SSR build. Keep the
  // canonical source (and its Node build checks) intact after this target build.
  // No auth guard, data loader or component is removed.
  for (const [path, declaration] of assertions) {
    assert(!interrupted, `Build interrupted: ${interrupted}`);
    const file = new URL(path, web);
    const original = await readFile(file, 'utf8');
    assert(
      original.includes(declaration),
      `Missing expected declaration: ${path}`,
    );
    const generated = original.replace(
      declaration,
      '// PPR-only declaration omitted in the Cloudflare SSR target.',
    );
    patched.push({ file, original, generated });
    await writeFile(file, generated);
  }
  // The RSC cache wrapper is embedded in webpack app chunks as well as traced
  // into standalone. Patch both source variants before compiling those chunks.
  for (const prefix of ['', 'esm/']) {
    const file = new URL(
      `node_modules/next/dist/${prefix}server/use-cache/use-cache-wrapper.js`,
      web,
    );
    const original = await readFile(file, 'utf8');
    const generated = patchUseCache(original);
    patched.push({ file, original, generated });
    await writeFile(file, generated);
    const loadingFile = new URL(
      `node_modules/next/dist/${prefix}server/app-render/module-loading/track-module-loading.instance.js`,
      web,
    );
    const loadingOriginal = await readFile(loadingFile, 'utf8');
    const loadingGenerated = patchModuleLoading(loadingOriginal);
    patched.push({ file: loadingFile, original: loadingOriginal, generated: loadingGenerated });
    await writeFile(loadingFile, loadingGenerated);
  }
  assert(!interrupted, `Build interrupted: ${interrupted}`);
  const exitCode = await new Promise((resolve, reject) => {
    child = spawn('node_modules/.bin/next', ['build', '--webpack'], {
      cwd: fileURLToPath(web),
      env: process.env,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      resolve(interrupted === 'SIGINT' ? 130 : interrupted ? 143 : (code ?? 1)),
    );
  });
  process.exitCode = exitCode;
  if (exitCode === 0) await patchStandaloneCache(web);
} finally {
  for (const { file, original, generated } of patched.reverse()) {
    const current = await readFile(file, 'utf8');
    assert(
      current === generated || current === original,
      `Concurrent source edit: ${file}`,
    );
    await writeFile(file, original);
  }
  clearTimeout(killTimer);
  for (const [signal, handler] of handlers) {
    process.removeListener(signal, handler);
  }
}
