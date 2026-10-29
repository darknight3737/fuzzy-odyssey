import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { patchStandaloneCache } from './patch-selletive-use-cache.mjs';

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
