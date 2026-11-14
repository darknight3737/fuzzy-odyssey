import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const webRequire = createRequire(
  new URL('../../apps/web/package.json', import.meta.url),
);
const e2eRequire = createRequire(
  new URL('../../apps/e2e/package.json', import.meta.url),
);
const { createClient } = webRequire('@supabase/supabase-js');
const { chromium, expect } = e2eRequire('@playwright/test');
const site = process.env.SELLETIVE_TEST_SITE;
assert.equal(
  site,
  'http://localhost:3000',
  'Only a disposable CI application is supported',
);
assert.equal(process.env.SELLETIVE_DISPOSABLE_DB, 'true');
assert.equal(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'http://127.0.0.1:54321',
  'Only the disposable CI database is supported',
);
assert(process.env.SUPABASE_SECRET_KEY, 'A preview service key is required');
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const token = `ci${randomUUID().replaceAll('-', '')}`;
const password = `${randomUUID()}Aa1!`;
const output = join(process.env.RUNNER_TEMP || '/tmp', 'selletive-marketplace');
await mkdir(output, { recursive: true });
let userId;
let buyerId;
let categoryId;
let childCategoryId;
let locationId;
let browser;
const check = (result) => {
  assert.ifError(result.error);
  return result.data;
};
async function signIn(page, email) {
  const emailField = page.locator('input[name="email"]');
  const passwordField = page.locator('input[name="password"]');
  const submit = page.locator('[data-test="auth-submit-button"]');
  await expect(submit).toBeEnabled();
  let login;
  for (let attempt = 0; attempt < 2 && !login; attempt++) {
    await emailField.selectText();
    await emailField.pressSequentially(email);
    await passwordField.selectText();
    await passwordField.pressSequentially(password);
    await expect(emailField).toHaveValue(email);
    await expect(passwordField).toHaveValue(password);
    [login] = await Promise.all([
      page
        .waitForResponse(
          (response) =>
            new URL(response.url()).pathname.endsWith('/auth/v1/token'),
          { timeout: 8000 },
        )
        .catch((error) => {
          if (error.name !== 'TimeoutError' || attempt === 1) throw error;
        }),
      submit.click(),
    ]);
  }
  assert.equal(login.status(), 200, 'Password sign-in must succeed');
}

try {
  const user = check(
    await admin.auth.admin.createUser({
      email: `owner@${token}.example.test`,
      password,
      email_confirm: true,
    }),
  );
  userId = user.user.id;
  const buyer = check(
    await admin.auth.admin.createUser({
      email: `${token}-buyer@example.test`,
      password,
      email_confirm: true,
    }),
  );
  buyerId = buyer.user.id;
  const category = check(
    await admin
      .from('categories')
      .insert({
        name: `Teste ${token}`,
        slug: token,
        level: 1,
        is_active: true,
      })
      .select('id')
      .single(),
  );
  categoryId = category.id;
  const childCategoryName = `Especialidade ${token}`;
  const childCategory = check(
    await admin
      .from('categories')
      .insert({
        // Match the legacy PostgreSQL IDs seeded in the production catalog.
        id: randomUUID().replace(/^(.{19})./, (_, prefix) => prefix + '2'),
        name: childCategoryName,
        slug: `${token}-child`,
        level: 2,
        parent_id: categoryId,
      })
      .select('id')
      .single(),
  );
  childCategoryId = childCategory.id;
  check(
    await admin.from('category_aliases').insert({
      category_id: childCategoryId,
      alias_name: `Automação ${token}`,
      alias_slug: `alias-${token}`,
    }),
  );
  const location = check(
    await admin
      .from('locations')
      .insert({
        name: `Teste ${token}`,
        slug: `${token}-sp-br`,
        type: 'city',
        country_code: 'br',
        state_code: 'sp',
      })
      .select('id')
      .single(),
  );
  locationId = location.id;
  const entries = Array.from({ length: 55 }, (_, index) => ({
    account_id: userId,
    name: `${token} ${String(index).padStart(2, '0')}`,
    slug: `${token}-${index}`,
    tier: index === 0 ? 'spotlight' : 'verified',
    offering_kind: index < 2 ? 'software' : 'service',
    works_remotely: index === 2,
    min_budget: 100 + index,
    max_budget: 500 + index,
    employee_count: index + 1,
    features: index === 0 ? ['ci-feature'] : [],
    integrations: index === 0 ? ['ci-integration'] : [],
    free_trial: index === 0,
    portuguese: index === 0,
  }));
  const businesses = check(
    await admin.from('businesses').insert(entries).select('id,slug,name'),
  );
  check(
    await admin
      .from('business_categories')
      .insert(
        businesses.map((b) => ({ business_id: b.id, category_id: categoryId })),
      ),
  );
  check(
    await admin
      .from('business_locations')
      .insert(
        businesses.map((b) => ({ business_id: b.id, location_id: locationId })),
      ),
  );
  const first = businesses.find((b) => b.slug === `${token}-0`);
  const second = businesses.find((b) => b.slug === `${token}-1`);
  assert(first && second);
  check(
    await admin.from('reviews').insert([
      {
        business_id: first.id,
        reviewer_name: 'Teste CI',
        reviewer_email: `${token}@example.test`,
        rating: 3,
        status: 'approved',
      },
      {
        business_id: second.id,
        reviewer_name: 'Teste CI',
        reviewer_email: `${token}@example.test`,
        rating: 5,
        status: 'approved',
      },
    ]),
  );
  browser = await chromium.launch({
    channel: process.env.SELLETIVE_BROWSER_CHANNEL || undefined,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${site}/search?q=${token}&sort=name`);
  await expect(page.getByText('55 resultados encontrados')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(5);
  await page.goto(`${site}/search?q=${token}&sort=name&kind=service`);
  await expect(page.getByText('53 resultados encontrados')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(24);
  await page.getByRole('link', { name: 'Próxima →' }).click();
  await expect(page).toHaveURL(/page=2$/);
  await expect(page.getByText('Página 2 de 3', { exact: true })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(24);
  await page.getByRole('link', { name: 'Próxima →' }).click();
  await expect(page).toHaveURL(/page=3$/);
  await expect(page.getByText('Página 3 de 3', { exact: true })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(5);
  await page.goto(`${site}/search?q=${token}&kind=software&sort=rating`);
  await expect(page.getByText('2 resultados encontrados')).toBeVisible();
  await expect(page.locator('article').first()).toContainText(second.name);
  await page.goto(
    `${site}/search?q=${token}&kind=software&features=ci-feature&integrations=ci-integration&free_trial=true&portuguese=true`,
  );
  await expect(page.getByText('1 resultados encontrados')).toBeVisible();
  await expect(page.locator('article')).toContainText(first.name);
  await page.goto(`${site}/${token}/${token}-sp-br?kind=service&remote=true`);
  await expect(page.getByText('1 resultados encontrados')).toBeVisible();
  await page.goto(`${site}/search?q=${token}&kind=software&sort=name`);
  await page
    .locator('article')
    .nth(0)
    .getByRole('button', { name: /^Salvar .+ na lista$/ })
    .click();
  await page
    .locator('article')
    .nth(1)
    .getByRole('button', { name: /^Salvar .+ na lista$/ })
    .click();
  await page.reload();
  await expect(page.getByLabel('Empresas salvas')).toContainText('2/5');
  await page.getByRole('link', { name: 'Comparar softwares' }).click();
  await expect(
    page.getByRole('heading', { name: 'Comparar softwares' }),
  ).toBeVisible();
  await expect(page.locator('table')).toContainText(first.name);
  await expect(page.locator('table')).toContainText(second.name);
  await page.screenshot({ path: join(output, 'compare.png'), fullPage: true });
  await page.goto(`${site}/company/${first.slug}`);
  await expect(page.getByRole('heading', { name: first.name })).toBeVisible();
  await page.screenshot({ path: join(output, 'profile.png'), fullPage: true });
  await page.goto(`${site}/search?q=${token}&kind=software`);
  await page.getByRole('link', { name: 'Enviar briefing' }).click();
  await expect(page).toHaveURL(/\/projects\/new\?providers=/);
  await expect(
    page.getByRole('heading', { name: 'Entre para enviar seu pedido' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Entrar ou criar conta' }).click();
  await signIn(page, `${token}-buyer@example.test`);
  await page.waitForURL((url) => url.pathname.includes('/projects/new'));
  const briefForm = page.locator('[data-test=project-brief-form]');
  await expect(briefForm).toBeVisible({ timeout: 15000 });
  await expect(briefForm).toContainText(first.name);
  await expect(briefForm).toContainText(second.name);
  await page.screenshot({ path: join(output, 'briefing.png'), fullPage: true });
  await briefForm.locator('[name=title]').fill('Pedido de demonstração CI');
  await page
    .locator('[data-test=project-brief-form] [name=description]')
    .fill(
      'Quero comparar os dois produtos para a operação comercial da minha empresa.',
    );
  await briefForm.locator('[name=buyer_name]').fill('Comprador CI');
  await briefForm.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Enviar pedido gratuitamente' })
    .click();
  await page.waitForURL('**/home/leads');
  await page.getByRole('link', { name: /Pedido de demonstração CI/ }).click();
  await page.waitForURL(/\/home\/leads\/[0-9a-f-]+$/);
  const conversation = page.url();
  await expect(
    page.getByRole('heading', { name: 'Pedido de demonstração CI' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: first.name })).toBeVisible();
  await expect(page.getByRole('heading', { name: second.name })).toBeVisible();
  const seller = await browser.newPage();
  await seller.goto(
    site +
      '/auth/sign-in?next=' +
      encodeURIComponent(new URL(conversation).pathname),
  );
  await signIn(seller, `owner@${token}.example.test`);
  await seller.waitForURL(conversation);
  await expect(
    seller.getByRole('heading', { name: 'Pedido de demonstração CI' }),
  ).toBeVisible({ timeout: 15000 });
  const sellerThread = seller.locator('section').filter({
    has: seller.getByRole('heading', { name: first.name, exact: true }),
  });
  const response = 'Posso apresentar o produto amanhã.';
  await sellerThread
    .locator('textarea[name=content]')
    .pressSequentially(response);
  await expect(sellerThread.locator('textarea[name=content]')).toHaveValue(
    response,
  );
  await sellerThread.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(
    sellerThread.locator('article').filter({ hasText: response }),
  ).toBeVisible({ timeout: 15000 });
  await page.reload();
  await expect(
    page.locator('article').filter({ hasText: response }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Encerrar pedido' }).click();
  await expect(
    page.getByText('Este pedido foi encerrado.').first(),
  ).toBeVisible();
  seller.on('pageerror', (error) => errors.push(error.message));
  const ownerSite = `${token}.example.test`;
  await seller.goto(`${site}/home/offerings/new?site=${ownerSite}`);
  const profileName = `Agência CI ${token}`;
  await seller.route('**/api/offerings/website?*', (route) =>
    route.fulfill({
      json: {
        name: profileName,
        description: 'Ajudamos empresas B2B a revisar a estratégia comercial.',
      },
    }),
  );
  await seller.locator('[data-test="offering-kind-software"]:visible').click();
  await expect(seller.getByLabel('Nome do software')).toBeVisible();
  await expect(seller.getByLabel('Descrição breve da solução')).toHaveAttribute(
    'placeholder',
    /^Ex\.: Software que ajuda/,
  );
  await seller.getByRole('button', { name: 'Voltar', exact: true }).click();
  await seller.locator('[data-test="offering-kind-service"]:visible').click();
  await expect(seller.getByLabel('Descrição breve da solução')).toHaveAttribute(
    'placeholder',
    /^Ex\.: Ajudamos pequenas empresas/,
  );
  const website = seller.getByLabel('Site oficial', { exact: true });
  await expect(website).toHaveValue(`https://${ownerSite}`);
  await website.selectText();
  await website.press('Backspace');
  await expect(website).toHaveValue('');
  await expect(
    seller.getByText('Dados sugeridos a partir do site.', { exact: false }),
  ).toBeHidden();
  await seller.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(
    seller.getByText('Informe um domínio válido', { exact: false }),
  ).toBeVisible();
  await website.pressSequentially(`https://${ownerSite}`);
  await expect(
    seller.getByLabel('Nome da empresa', { exact: true }),
  ).toHaveValue(profileName);
  await expect(seller.getByLabel('Descrição breve da solução')).toHaveValue(
    'Ajudamos empresas B2B a revisar a estratégia comercial.',
  );
  await seller.getByRole('button', { name: 'Continuar', exact: true }).click();
  await seller.getByRole('button', { name: 'Revisar perfil' }).click();
  await expect(
    seller.getByText('Selecione pelo menos uma especialidade.'),
  ).toBeVisible();
  const childCheckbox = seller.locator(
    `[data-test="offering-category-${childCategoryId}"]`,
  );
  await expect(childCheckbox).toBeHidden();
  await seller.locator(`[data-test="offering-group-${categoryId}"]`).click();
  await expect(childCheckbox).toBeVisible();
  await seller.getByLabel('Buscar especialidades').fill(`automacao ${token}`);
  await expect(
    seller.getByRole('list', { name: 'Resultados da busca' }),
  ).toContainText(childCategoryName);
  await childCheckbox.check();
  await expect(seller.getByText('1 de 10 selecionadas')).toBeVisible();
  await seller.getByRole('button', { name: 'Revisar perfil' }).click();
  await expect(
    seller.getByRole('region', { name: 'Prévia do perfil' }),
  ).toContainText(profileName);
  await seller
    .getByRole('button', { name: 'Escolher como confirmar vínculo' })
    .click();
  await seller.waitForURL(/\/home\/verification\//);
  await expect(
    seller.getByRole('heading', {
      name: 'Instale o selo e ganhe o Verificado',
    }),
  ).toBeVisible();
  const { count: unpublished, error: draftError } = await admin
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('name', profileName);
  assert.ifError(draftError);
  assert.equal(unpublished, 0, 'Draft must not appear before confirmation');
  await seller.getByText('Outras opções para confirmar vínculo').click();
  await seller.locator('[data-test="verification-account-email"]').click();
  await expect(
    seller.getByRole('heading', { name: 'Seu perfil está no ar' }),
  ).toBeVisible({ timeout: 15000 });
  await seller.getByRole('link', { name: 'Abrir página publicada' }).click();
  await expect(
    seller.getByRole('heading', { name: profileName, exact: true }),
  ).toBeVisible();
  await seller.close();

  assert.deepEqual(errors, [], 'No browser errors');
  console.log(
    'Browser: offering registration, category alias search and publication passed',
  );
} finally {
  if (browser) await browser.close();
  // Remove the conversations before deleting their participants. Running
  // both user cascades concurrently can contend on the same lead threads.
  const cleanup = [];
  if (buyerId) {
    cleanup.push(
      ...(await Promise.allSettled([
        admin
          .from('lead_briefs')
          .delete()
          .eq('buyer_user_id', buyerId)
          .then(check),
      ])),
    );
  }
  for (const id of [userId, buyerId]) {
    if (id)
      cleanup.push(
        ...(await Promise.allSettled([
          admin.auth.admin.deleteUser(id).then(check),
        ])),
      );
  }
  if (childCategoryId) {
    cleanup.push(
      ...(await Promise.allSettled([
        admin.from('categories').delete().eq('id', childCategoryId).then(check),
      ])),
    );
  }
  if (categoryId)
    cleanup.push(
      ...(await Promise.allSettled([
        admin.from('categories').delete().eq('id', categoryId).then(check),
      ])),
    );
  if (locationId)
    cleanup.push(
      ...(await Promise.allSettled([
        admin.from('locations').delete().eq('id', locationId).then(check),
      ])),
    );
  for (const result of cleanup)
    if (result.status === 'rejected')
      console.error('Fixture cleanup failed:', result.reason);
  assert(
    cleanup.every((result) => result.status === 'fulfilled'),
    'Fixture cleanup must succeed',
  );
}
