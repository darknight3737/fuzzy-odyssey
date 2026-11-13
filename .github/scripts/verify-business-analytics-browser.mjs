import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const webRequire = createRequire(
  new URL('../../apps/web/package.json', import.meta.url),
);
const e2eRequire = createRequire(
  new URL('../../apps/e2e/package.json', import.meta.url),
);
const { createClient } = webRequire('@supabase/supabase-js');
const { chromium, expect } = e2eRequire('@playwright/test');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http://127.0.0.1:54321');
assert.equal(process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000');
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const email = `analytics-${randomUUID()}@example.test`;
const password = `${randomUUID()}aA!`;
const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const site = 'http://localhost:3000';
const slug = `analytics-browser-${randomUUID()}`;
let userId;
let businessId;
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const user = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.ifError(user.error);
  userId = user.data.user.id;
  const business = await admin
    .from('businesses')
    .insert({
      name: 'Analytics browser CI',
      slug,
      account_id: userId,
      tier: 'highlight',
      website: 'https://analytics-contact.example',
      phone: '5511999990000',
      email: 'contact@example.test',
    })
    .select('id')
    .single();
  assert.ifError(business.error);
  businessId = business.data.id;
  const visitor = await browser.newContext({
    userAgent,
    extraHTTPHeaders: { 'cf-connecting-ip': '192.0.2.100' },
  });
  await visitor.route('https://analytics-contact.example/**', (route) =>
    route.fulfill({ body: '<h1>Contact destination</h1>' }),
  );
  const page = await visitor.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const view = page.waitForResponse(
    (r) =>
      r.url().endsWith('/api/business-interest') &&
      r.request().postDataJSON().event === 'view',
  );
  await page.goto(`${site}/company/${slug}`);
  assert.equal((await view).status(), 204);
  for (const event of ['website', 'phone', 'email']) {
    const link = page.locator(`[data-test="business-contact-${event}"]`);
    await expect(link).toBeVisible();
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/business-interest') &&
        r.request().postDataJSON().event === event,
    );
    await link.click();
    assert.equal((await response).status(), 204);
  }
  const repeated = page.waitForResponse((r) =>
    r.url().endsWith('/api/business-interest'),
  );
  await page.reload();
  assert.equal((await repeated).status(), 204);
  const counts = await admin
    .from('business_analytics_daily')
    .select('event,count')
    .eq('business_id', businessId);
  assert.ifError(counts.error);
  assert.deepEqual(
    Object.fromEntries(counts.data.map((row) => [row.event, row.count])),
    { view: 1, website: 1, phone: 1, email: 1 },
  );
  await visitor.close();
  const owner = await browser.newContext({
    userAgent,
    extraHTTPHeaders: { 'cf-connecting-ip': '192.0.2.101' },
  });
  const dashboard = await owner.newPage();
  dashboard.on('pageerror', (error) => errors.push(error.message));
  await dashboard.goto(`${site}/auth/sign-in?next=/home/businesses/${slug}`);
  await dashboard.locator('input[name="email"]').fill(email);
  await dashboard.locator('input[name="password"]').fill(password);
  await dashboard.locator('button[type="submit"]').click();
  await dashboard.waitForURL((url) => url.pathname.includes('/home'), {
    timeout: 30000,
  });
  await dashboard.goto(`${site}/home/businesses/${slug}`);
  const progress = dashboard.getByRole('progressbar', {
    name: 'Configuração do perfil',
  });
  await expect(progress).toBeVisible();
  const completed = await progress.getAttribute('aria-valuenow');
  await dashboard
    .getByRole('link', { name: 'Desempenho', exact: true })
    .click();
  await dashboard.getByText('Próximos passos', { exact: true }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', completed ?? '');
  await expect(
    dashboard.locator('[data-test="business-analytics"]'),
  ).toBeVisible();
  for (const event of ['view', 'website', 'phone', 'email'])
    await expect(
      dashboard.locator(`[data-test="analytics-${event}"]`),
    ).toHaveText('1');
  const ownerView = dashboard.waitForResponse((r) =>
    r.url().endsWith('/api/business-interest'),
  );
  await dashboard.goto(`${site}/company/${slug}`);
  assert.equal((await ownerView).status(), 204);
  const after = await admin
    .from('business_analytics_daily')
    .select('count')
    .eq('business_id', businessId)
    .eq('event', 'view')
    .single();
  assert.ifError(after.error);
  assert.equal(
    after.data.count,
    1,
    'Authenticated owner on a different network does not count',
  );
  const downgrade = await admin
    .from('businesses')
    .update({ tier: 'claimed' })
    .eq('id', businessId);
  assert.ifError(downgrade.error);
  await dashboard.goto(`${site}/home/businesses/${slug}/desempenho`);
  await expect(
    dashboard.locator('[data-test="business-analytics-locked"]'),
  ).toBeVisible();
  await expect(
    dashboard.locator('[data-test="business-analytics"]'),
  ).toHaveCount(0);
  assert.deepEqual(errors, []);
  await owner.close();
  console.log(
    'Browser: contacts, dedupe, private dashboard, owner exclusion and downgrade passed',
  );
} finally {
  await browser.close();
  if (businessId) await admin.from('businesses').delete().eq('id', businessId);
  if (userId) await admin.auth.admin.deleteUser(userId);
}
