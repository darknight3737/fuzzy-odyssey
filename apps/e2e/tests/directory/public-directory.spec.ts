import { expect, test } from '@playwright/test';

test('a busca da home abre resultados que não são indexáveis', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'O próximo passo',
  );
  await page.locator('#provider-search').fill('Marketing');
  await page.locator('[data-test="homepage-search"]').click();
  await expect(page).toHaveURL(/\/search\?q=Marketing/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Marketing',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );
});

test('a home não cria rolagem horizontal no celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test('URLs de diretório inexistentes retornam HTTP 404', async ({
  request,
}) => {
  for (const path of [
    '/company/directory-nonexistent-test-profile',
    '/categories/directory-nonexistent-category',
    '/directory-nonexistent-category/nonexistent-br',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  }
});

test('robots referencia o sitemap que realmente existe', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  expect(await sitemap.text()).toContain('<sitemapindex');
  const staticMap = await request.get('/sitemaps/static/0');
  expect(staticMap.status()).toBe(200);
  expect(await staticMap.text()).toContain('<urlset');
});
