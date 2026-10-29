import assert from 'node:assert/strict';
import { appendFile, mkdir } from 'node:fs/promises';
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
  // Best-effort cancellation stress supplements the deterministic installed-Next
  // map-isolation regression. Then verify complete responses across routes.
  const routes = [
    ['/', 'Sua próxima grande parceria'],
    ['/categories', 'categorias'],
    ['/search', 'Encontre seu próximo parceiro'],
  ];
  await Promise.allSettled(
    routes.map(async ([path]) => {
      const response = await fetch(`${site}${path}`, {
        signal: AbortSignal.timeout(800),
      });
      await response.body?.cancel();
    }),
  );
  for (let round = 0; round < 3; round++) {
    await Promise.all(
      routes.map(async ([path, heading]) => {
        const response = await fetch(`${site}${path}`, {
          signal: AbortSignal.timeout(15000),
        });
        assert.equal(response.status, 200, `${path}: HTTP status`);
        const html = await response.text();
        assert.match(html, new RegExp(`<h1[^>]*>[\\s\\S]*?${heading}`, 'i'));
        assert(!/\d+:E\{/.test(html), `${path}: server rendering error`);
      }),
    );
  }
  // Give cancelled request contexts time to be torn down before fresh visits.
  await new Promise((resolve) => setTimeout(resolve, 32000));
  await Promise.all(
    routes.map(async ([path, heading]) => {
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
    }),
  );
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(site);
  assert.equal(response.status(), 200);
  assert.match(response.headers()['x-robots-tag'], /noindex/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Sua próxima grande parceria',
  );
  await page
    .locator('[data-test="homepage-search-input"]:visible')
    .fill('Selletive preview');
  await page.locator('[data-test="homepage-search"]:visible').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Selletive preview',
  );
  const screenshots = `${process.env.RUNNER_TEMP}/selletive-homepage`;
  await mkdir(screenshots, { recursive: true });
  for (const width of [320, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
    });
    try {
      const home = await context.newPage();
      home.on('pageerror', (error) => errors.push(error.message));
      await home.goto(site);
      await expect(
        home.locator('[data-test="workable-home"]:visible'),
      ).toBeVisible();
      await home.evaluate(() => document.fonts.ready);
      const typography = await home.evaluate(() => ({
        body: getComputedStyle(document.body).fontFamily,
        heading: getComputedStyle(document.querySelector('#hero-title')).fontFamily,
        editorial: getComputedStyle(document.querySelector('#hero-title span')).fontFamily,
        loaded: [...document.fonts]
          .filter((face) => face.status === 'loaded')
          .map((face) => face.family.replaceAll('"', '').replaceAll("'", '')),
      }));
      assert(typography.body.includes('Suisse Screen'), 'Suisse body font missing');
      assert(typography.heading.includes('Suisse Intl'), 'Suisse heading font missing');
      assert(typography.editorial.includes('Suisse Works'), 'Suisse editorial font missing');
      assert(typography.loaded.includes('Suisse Intl'), 'Suisse Intl failed to load');
      assert(typography.loaded.includes('Suisse Works'), 'Suisse Works failed to load');
      assert(typography.loaded.includes('Suisse Screen'), 'Suisse Screen failed to load');
      assert(typography.loaded.includes('Suisse Intl Mono'), 'Suisse Mono failed to load');

      assert(
        await home.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Homepage overflow at ${width}px`,
      );
      await expect(
        home.getByRole('textbox', {
          name: 'Qual serviço sua empresa precisa?',
        }),
      ).toBeVisible();
      await home.screenshot({
        path: `${screenshots}/home-${width}.png`,
        fullPage: true,
      });
      if (width === 390) {
        await home.evaluate(() => {
          const probe = document.createElement('span');
          probe.id = 'suisse-glyph-probe';
          probe.textContent = '123456789áéãç@&';
          probe.style.cssText = 'position:absolute;left:-9999px;font-weight:400';
          document.body.append(probe);
        });
        await home.evaluate(() => document.fonts.ready);
        const cdp = await context.newCDPSession(home);
        await cdp.send('DOM.enable');
        await cdp.send('CSS.enable');
        const { root } = await cdp.send('DOM.getDocument');
        const { nodeId } = await cdp.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector: '#suisse-glyph-probe',
        });
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        assert(fonts.length > 0, 'Suisse glyph probe rendered no font');
        assert(
          fonts.every((font) => /Suisse.*Int/i.test(font.familyName)),
          `Trial glyph fallback failed: ${JSON.stringify(fonts)}`,
        );
        await cdp.detach();
        await home.locator('#suisse-glyph-probe').evaluate((node) => node.remove());
        await home.getByRole('button', { name: 'Abrir menu' }).click();
        await home.getByRole('menuitem', { name: 'Explorar empresas' }).click();
        await expect(home).toHaveURL(/\/categories$/);
        await expect(home.getByRole('heading', { level: 1 })).toBeVisible();
      }
      if (width === 1440) {
        await home.keyboard.press('Tab');
        await expect(
          home.getByRole('link', { name: 'Ir para o conteúdo' }),
        ).toBeFocused();
        await home.keyboard.press('Enter');
        await expect(home.locator('#main-content')).toBeFocused();
        await home
          .getByRole('textbox', { name: 'Qual serviço sua empresa precisa?' })
          .fill('Design & Tecnologia');
        await home
          .getByRole('textbox', { name: 'Qual serviço sua empresa precisa?' })
          .press('Enter');
        await expect(home).toHaveURL(/q=Design/);
        assert.equal(
          new URL(home.url()).searchParams.get('q'),
          'Design & Tecnologia',
        );
      }
    } finally {
      await context.close();
    }
  }
  // Verify native GET submission without JavaScript. The existing results
  // route hydrates its Suspense content, so full results are tested above.
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  try {
    const home = await noJs.newPage();
    await home.goto(site);
    await home
      .locator('[data-test="homepage-search-input"]:visible')
      .fill('Marketing');
    const navigation = home.waitForResponse(
      (response) =>
        response.request().isNavigationRequest() &&
        new URL(response.url()).pathname === '/search',
    );
    await home.locator('[data-test="homepage-search"]:visible').click();
    const response = await navigation;
    assert.equal(response.request().method(), 'GET');
    assert.equal(response.status(), 200);
    await expect(home).toHaveURL(/q=Marketing/);
  } finally {
    await noJs.close();
  }
  await page.goto(`${site}/categories`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toHaveCSS(
    'background-color',
    'rgb(1, 38, 32)',
  );
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
