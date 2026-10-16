import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const bundle = await readFile(join(process.argv[2], 'worker.js'), 'utf8');
const start = bundle.indexOf('// .open-next/selletive-runtime/timers.js');
assert(start >= 0, 'Worker bundler removed the timer bootstrap');
const bootstrap = bundle.slice(start, start + 500);
assert.match(bootstrap, /globalThis\.setImmediate\s*=/);
assert.match(bootstrap, /globalThis\.clearImmediate\s*=/);
console.log('Bundled Node immediate bootstrap retained');
