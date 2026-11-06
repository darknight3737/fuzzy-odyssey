import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/web/package.json', import.meta.url));
const { loadBindings, transformSync } = require('next/dist/build/swc');
await loadBindings();
function load(path, dependencies) {
  const { code } = transformSync(readFileSync(new URL(`../../apps/web/${path}`, import.meta.url), 'utf8'), {
    filename: path, jsc: { parser: { syntax: 'typescript', tsx: false }, target: 'es2022' },
    module: { type: 'commonjs', noInterop: true },
  });
  const loaded = { exports: {} };
  new Function('require', 'exports', 'module', code)(
    (name) => name in dependencies ? dependencies[name] : require(name), loaded.exports, loaded);
  return loaded.exports;
}
const events = ['view', 'website', 'phone', 'email'];
const calls = [];
let authError = null;
let actor = null;
let databaseFails = false;
process.env.SUPABASE_SECRET_KEY = 'ci-only-analytics-test-secret';
const { POST } = load('app/api/business-interest/route.ts', {
  '@kit/next/routes': { enhanceRouteHandler: (handler) => (request) => handler({ request, client: {
    auth: { getUser: async () => ({ data: { user: actor }, error: authError }) },
  } }) },
  '@kit/supabase/server-admin-client': { getSupabaseServerAdminClient: () => ({}) },
  '~/config/app.config': { default: { url: 'https://selletive.example' } },
  '~/lib/business-analytics/events': { interestEvents: events },
  '~/lib/business-analytics/service': { createBusinessAnalyticsService: () => ({ record: async (input) => {
    if (databaseFails) throw new Error('offline');
    calls.push(input);
  } }) },
});
const id = '21000000-0000-4000-8000-000000000001';
function request(body = { businessId: id, event: 'view' }, extra = {}) {
  return new Request('https://selletive.example/api/business-interest', { method: 'POST',
    headers: { origin: 'https://selletive.example', 'sec-fetch-site': 'same-origin',
      'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1',
      'user-agent': 'Mozilla/5.0 Chrome/130 Safari/537.36', ...extra }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
assert.equal((await POST(request())).status, 204);
assert.equal(calls.length, 1);
assert.match(calls[0].visitorHash, /^[a-f0-9]{64}$/);
assert.ok(!JSON.stringify(calls).includes('192.0.2.1'));
assert.equal(calls[0].businessId, id);
assert.equal(calls[0].day, new Date().toISOString().slice(0, 10));
for (const headers of [{ origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }]) {
  assert.equal((await POST(request(undefined, headers))).status, 403);
}
for (const headers of [{ dnt: '1' }, { 'sec-gpc': '1' }, { 'user-agent': 'Googlebot' }, { 'cf-connecting-ip': '' }]) {
  assert.equal((await POST(request(undefined, headers))).status, 204);
}
assert.equal(calls.length, 1, 'Dropped requests never reach privileged writer');
assert.equal((await POST(request({ businessId: id, event: 'view', count: 999 }))).status, 400);
assert.equal((await POST(request({ businessId: 'invalid', event: 'view' }))).status, 400);
assert.equal((await POST(request({ businessId: id, event: 'lead' }))).status, 400);
assert.equal((await POST(request('{'))).status, 400);
assert.equal((await POST(request('x'.repeat(513)))).status, 413);
assert.equal((await POST(request(undefined, { 'content-type': 'text/plain' }))).status, 415);
authError = { name: 'AuthSessionMissingError' };
assert.equal((await POST(request())).status, 204);
assert.equal(calls.length, 2);
assert.equal(calls[0].visitorHash, calls[1].visitorHash, 'Repeated visitor gets same daily dedupe hash');
authError = { name: 'AuthApiError' };
await POST(request());
assert.equal(calls.length, 2, 'Invalid session never falls back to unrelated visitor');
authError = null;
actor = { id: 'owner-id' };
await POST(request({ businessId: id, event: 'website' }));
assert.equal(calls.at(-1).actorId, 'owner-id');
databaseFails = true;
assert.equal((await POST(request())).status, 503);
console.log('Business analytics ingestion boundaries passed');
