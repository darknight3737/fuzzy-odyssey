import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { appendFile, readFile, readdir, writeFile } from 'node:fs/promises';

// Intentionally fixed destinations: never accept a project/account from input.
const project = 'cnagsmkfjkxyxlefrkhu';
const organization = 'kkqpanpyzsijqhbrlqnk';
const account = '197b766a23439aced586d68ea5ec5463';
const site = 'https://selletive.frd-monteiro97.workers.dev';
const cacheNamespace = 'ef2629839c3943ca9eee730a912c5d88';
const migrationPath = 'apps/web/supabase/migrations';
const fixtures = '20250927170839';
const secretFile = `${process.env.RUNNER_TEMP}/selletive-worker-secrets.json`;
const applicationOnly = process.env.SELLETIVE_APPLICATION_ONLY === 'true';

function mask(value) {
  if (value) console.log(`::add-mask::${value}`);
  return value;
}

async function request(provider, path, method = 'GET', body) {
  const supabase = provider === 'supabase';
  const token =
    process.env[supabase ? 'SUPABASE_ACCESS_TOKEN' : 'CLOUDFLARE_API_TOKEN'];
  assert(token, `Missing ${provider} deployment token`);
  const url = supabase
    ? `https://api.supabase.com/v1${path}`
    : `https://api.cloudflare.com/client/v4/accounts/${account}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) {
    // No request/response bodies in logs: API-key endpoints contain secrets.
    throw new Error(`${provider} ${method} ${path}: HTTP ${response.status}`);
  }
  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  if (!supabase) {
    assert(result.success, `Cloudflare request failed: ${path}`);
    return result.result;
  }
  return result;
}

async function sql(query) {
  return request('supabase', `/projects/${project}/database/query`, 'POST', {
    query,
  });
}

async function migrate() {
  const files = (await readdir(migrationPath))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const known = new Set(files.map((file) => file.slice(0, 14)));
  let history = await request(
    'supabase',
    `/projects/${project}/database/migrations`,
  );
  for (const entry of history) {
    assert(
      known.has(entry.version) ||
        files.some((file) => file.slice(15, -4) === entry.name),
      `Unknown remote migration ${entry.version}; inspect drift before proceeding`,
    );
  }

  for (const file of files) {
    const version = file.slice(0, 14);
    const name = file.slice(15, -4);
    if (history.some((entry) => entry.version === version)) continue;
    const pending = history.find((entry) => entry.name === name);
    if (!pending) {
      const query =
        version === fixtures
          ? '-- Production bootstrap: fictional users and companies intentionally omitted.'
          : await readFile(`${migrationPath}/${file}`, 'utf8');
      await request(
        'supabase',
        `/projects/${project}/database/migrations`,
        'POST',
        { name, query },
      );
    }
    // Management API generates a timestamp. Preserve repository versions for CLI/GitHub compatibility.
    await sql(
      `update supabase_migrations.schema_migrations set version = '${version}' where name = '${name}' and version <> '${version}';`,
    );
    history = await request(
      'supabase',
      `/projects/${project}/database/migrations`,
    );
    assert(
      history.some((entry) => entry.version === version),
      `Migration history missing ${version}`,
    );
    console.log(
      `Applied ${file}${version === fixtures ? ' (fixtures omitted)' : ''}`,
    );
  }
  const [check] = await sql(
    `select count(*) filter (where not relrowsecurity) as unprotected_tables from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r';`,
  );
  assert.equal(
    Number(check.unprotected_tables),
    0,
    'Public tables without RLS',
  );
}

async function prepare() {
  if (applicationOnly) {
    // This recovery path cannot silently skip a new schema or migration.
    execFileSync('git', [
      'diff', '--exit-code',
      'selletive-cloudflare-preview-verified-20261016', 'HEAD',
      '--', 'apps/web/supabase',
    ], { stdio: 'pipe' });
    assert(process.env.SELLETIVE_PUBLIC_KEY?.startsWith('sb_publishable_'));
  } else {
    const destination = await request('supabase', `/projects/${project}`);
    assert.equal(destination.id, project);
    assert.equal(destination.organization_id, organization);
    assert.equal(destination.name.toLowerCase(), 'selletive');
  }
  const subdomain = await request('cloudflare', '/workers/subdomain');
  assert.equal(subdomain.subdomain, 'frd-monteiro97');
  if (process.argv[2] === 'infrastructure') {
    // This namespace was provisioned and verified via MCP. Deploy does not need
    // account-wide KV-management access or bulk writes to unrelated namespaces.
    const config = JSON.parse(
      (await readFile('apps/web/wrangler.jsonc', 'utf8')).replace(
        /,\s*([}\]])/g,
        '$1',
      ),
    );
    assert.equal(config.account_id, account);
    assert.equal(config.name, 'selletive');
    assert.deepEqual(config.kv_namespaces, [
      { binding: 'NEXT_INC_CACHE_KV', id: cacheNamespace },
    ]);
    return;
  }
  if (!applicationOnly) await migrate();

  const keys = applicationOnly ? [{
    type: 'publishable', api_key: process.env.SELLETIVE_PUBLIC_KEY,
  }] : await request(
    'supabase',
    `/projects/${project}/api-keys?reveal=true`,
  );
  const publicKey = mask(
    keys.find((key) => key.type === 'publishable')?.api_key ??
      keys.find((key) => key.name === 'anon')?.api_key,
  );
  const secretKey = mask(
    keys.find((key) => key.type === 'secret')?.api_key ??
      keys.find((key) => key.name === 'service_role')?.api_key,
  );
  assert(publicKey && (applicationOnly || secretKey), 'Selletive API keys unavailable');
  const runtime = {
    NEXT_PUBLIC_SUPABASE_URL: `https://${project}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: publicKey,
    ...(!applicationOnly && { SUPABASE_SECRET_KEY: secretKey }),
    NEXT_PUBLIC_SITE_URL: site,
    NEXT_PUBLIC_DEFAULT_LOCALE: 'pt',
    NEXT_PUBLIC_BILLING_PROVIDER: 'stripe',
    NEXT_PUBLIC_ENABLE_TEAM_ACCOUNTS_BILLING: 'false',
    NEXT_PUBLIC_ENABLE_PERSONAL_ACCOUNT_BILLING: 'false',
    CMS_CLIENT: 'keystatic',
    MAILER_PROVIDER: 'resend',
    LOGGER: 'console',
    SELLETIVE_DEPLOYMENT_STAGE: 'preview',
    // Stable across redeploys; never use a short-lived deployment token here.
    ...(!applicationOnly && { SUPABASE_DB_WEBHOOK_SECRET: mask(
      createHmac('sha256', secretKey)
        .update(`selletive:${project}:database-webhook:v1`)
        .digest('hex'),
    ) }),
  };
  if (!applicationOnly) {
    await writeFile(secretFile, JSON.stringify(runtime), { mode: 0o600 });
  }
  for (const [name, value] of Object.entries(runtime)) {
    assert(!value.includes('\n'));
    await appendFile(process.env.GITHUB_ENV, `${name}=${value}\n`);
  }
  if (!applicationOnly) await request('supabase', `/projects/${project}/config/auth`, 'PATCH', {
    site_url: site,
    uri_allow_list: `${site}/**`,
    mailer_autoconfirm: false,
  });
  console.log(`Destination verified: Selletive ${project}; ${site}`);
}

await prepare();
