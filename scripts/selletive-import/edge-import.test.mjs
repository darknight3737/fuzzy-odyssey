import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

test('restricted import refuses unauthorised calls, preserves existing profiles and skips retries', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'selletive-import-test-'));
  const token = 'test-import-token';
  const sha = createHash('sha256').update(token).digest('hex');
  const source = (
    await readFile(new URL('./edge-import.js', import.meta.url), 'utf8')
  )
    .replace('__TOKEN_SHA256__', sha)
    .replace('__EXPIRES_AT__', '2099-01-01T00:00:00Z');
  const ids = [1, 2, 3, 4, 5].map(
    (n) => `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`,
  );
  const business = (id, website) => ({
    id,
    name: id,
    slug: id,
    website,
    account_id: null,
    tier: 'unclaimed',
    verification_status: 'pending',
    domain_rating: 0,
  });
  const payload = {
    categories: [
      { id: ids[3], slug: 'seo-services', level: 3, is_active: true },
    ],
    locations: [{ id: ids[4], slug: 'brazil-br', type: 'country' }],
    businesses: [
      business(ids[0], 'https://new.example'),
      business(ids[1], 'https://claimed.example'),
      business(ids[2], 'http://www.owned.example'),
    ],
    business_categories: ids
      .slice(0, 3)
      .map((id) => ({ business_id: id, category_id: ids[3] })),
    business_locations: ids
      .slice(0, 3)
      .map((id) => ({ business_id: id, location_id: ids[4] })),
  };
  const existingOwner = {
    ...business(ids[1], 'https://claimed.example'),
    account_id: 'owner',
    tier: 'claimed',
  };
  const sameDomain = {
    ...business(
      '99999999-9999-4999-8999-999999999999',
      'https://owned.example',
    ),
    account_id: 'another-owner',
    tier: 'claimed',
  };
  const database = {
    categories: [],
    locations: [],
    businesses: [existingOwner, sameDomain],
    business_categories: [],
    business_locations: [],
  };
  let handler;
  let writes = 0;
  globalThis.Deno = {
    env: {
      get: (key) =>
        ({
          SUPABASE_URL: 'https://cnagsmkfjkxyxlefrkhu.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'server-test-key',
        })[key],
    },
    serve: (fn) => {
      handler = fn;
    },
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(input);
    assert.equal(url.origin, 'https://cnagsmkfjkxyxlefrkhu.supabase.co');
    const table = url.pathname.split('/').at(-1);
    assert.ok(Object.hasOwn(database, table));
    if (options.method === 'GET') return Response.json(database[table]);
    assert.equal(options.method, 'POST', 'updates and deletes are forbidden');
    writes++;
    const rows = JSON.parse(options.body);
    if (table === 'businesses')
      for (const row of rows) {
        row.created_at = '2026-11-11T00:00:00Z';
        row.updated_at = row.created_at;
      }
    database[table].push(...rows);
    return Response.json(rows, { status: 201 });
  };
  try {
    await writeFile(join(directory, 'payload.json'), JSON.stringify(payload));
    await writeFile(join(directory, 'edge-import.mjs'), source);
    await import(pathToFileURL(join(directory, 'edge-import.mjs')).href);
    const request = (tokenValue = token, body) =>
      new Request('https://function.example', {
        method: 'POST',
        headers: { 'x-import-token': tokenValue },
        ...(body ? { body } : {}),
      });
    assert.equal((await handler(request('wrong-token'))).status, 401);
    assert.equal((await handler(request(token, '{}'))).status, 400);
    assert.equal(writes, 0);
    const response = await handler(request());
    const outcome = await response.json();
    assert.equal(response.status, 200, JSON.stringify(outcome));
    assert.equal(outcome.counts.businesses, 1);
    assert.equal(outcome.counts.skipped_existing_id, 1);
    assert.equal(outcome.counts.skipped_website, 1);
    assert.deepEqual(database.businesses[0], existingOwner);
    assert.equal(database.business_categories.length, 1);
    assert.equal(database.business_categories[0].business_id, ids[0]);
    assert.equal(database.business_locations.length, 1);
    const writesBeforeRetry = writes;
    const retry = await (await handler(request())).json();
    assert.equal(retry.counts.businesses, 0);
    assert.equal(
      writes,
      writesBeforeRetry,
      'retry must not write existing profiles or links',
    );
    database.business_locations.length = 0;
    const repair = await (await handler(request())).json();
    assert.equal(repair.counts.businesses, 0);
    assert.equal(
      repair.counts.business_locations,
      1,
      'retry repairs missing associations of untouched imported profiles',
    );
    assert.equal(database.business_locations.length, 1);
    database.business_locations.length = 0;
    database.businesses.find((row) => row.id === ids[0]).account_id =
      'new-owner';
    const claimed = await (await handler(request())).json();
    assert.equal(
      claimed.counts.business_locations,
      0,
      'a claimed profile is never repaired by this importer',
    );
  } finally {
    globalThis.fetch = realFetch;
    delete globalThis.Deno;
  }
});
