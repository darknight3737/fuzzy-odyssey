import assert from 'node:assert/strict';
import { appendFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(
  new URL('../../apps/e2e/package.json', import.meta.url),
);
const { chromium, expect } = require('@playwright/test');
const site = 'https://selletive.frd-monteiro97.workers.dev';
const health = await fetch(`${site}/api/healthcheck`, {
  signal: AbortSignal.timeout(15000),
});
assert(health.ok);
assert.equal((await health.json()).services.database, true);
const robots = await fetch(`${site}/robots.txt`);
assert.match(await robots.text(), /Disallow: \//);

const browser = await chromium.launch();
try {
  // A single successful warm response misses poisoned-isolate hangs. Abort
  // visits, then overlap different cached routes and verify full responses.
  const routes = [
    ['/', 'O próximo passo'],
    ['/categories', 'categorias'],
    ['/search', 'Encontre seu próximo parceiro'],
  ];
  await Promise.allSettled(
    routes.map(([path]) => fetch(`${site}${path}`, {
      signal: AbortSignal.timeout(100),
    })),
  );
  for (let round = 0; round < 3; round++) {
    await Promise.all(routes.map(async ([path, heading]) => {
      const response = await fetch(`${site}${path}`, {
        signal: AbortSignal.timeout(15000),
      });
      assert.equal(response.status, 200, `${path}: HTTP status`);
      const html = await response.text();
      assert.match(html, new RegExp(`<h1[^>]*>[\\s\\S]*?${heading}`, 'i'));
      assert(!/\d+:E\{/.test(html), `${path}: server rendering error`);
    }));
  }
  // Give cancelled request contexts time to be torn down before fresh visits.
  await new Promise((resolve) => setTimeout(resolve, 32000));
  await Promise.all(routes.map(async ([path, heading]) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(`${site}${path}`, { timeout: 20000 });
      assert.equal(response.status(), 200);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        new RegExp(heading, 'i'),
      );
      assert.deepEqual(errors, [], `${path}: fresh browser errors`);
    } finally {
      await context.close();
    }
  }));
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(site);
  assert.equal(response.status(), 200);
  assert.match(response.headers()['x-robots-tag'], /noindex/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'O próximo passo',
  );
  await page.locator('#provider-search:visible').fill('Selletive preview');
  await page.locator('[data-test="homepage-search"]:visible').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Selletive preview',
  );
  await page.goto(`${site}/categories`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto(`${site}/blog/saas-starter-guide`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A Comprehensive Starter Kit',
  );
  await page.goto(`${site}/docs`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Documentação',
  );
  await page.goto(`${site}/docs/getting-started/getting-started`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Introduction',
  );
  const missing = await page.request.get(
    `${site}/company/selletive-missing-smoke-test`,
  );
  assert.equal(missing.status(), 404);
  assert.deepEqual(errors, [], 'Browser rendering errors');
} finally {
  await browser.close();
}
await appendFile(
  process.env.GITHUB_STEP_SUMMARY,
  `Preview verified: ${site}\n`,
);
console.log(`Preview verified: ${site}`);
