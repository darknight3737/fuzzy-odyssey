import { expect, test, type Page } from '@playwright/test';
import { parse } from 'node-html-parser';

import { Mailbox } from '../utils/mailbox';
import { getSupabaseAdminClient } from '../utils/supabase-admin-client';

import { randomUUID } from 'node:crypto';

class DirectoryOwnerPage {
  constructor(private readonly page: Page) {}

  async signUp(email: string, slug: string) {
    await this.page.goto(
      `/auth/sign-up?next=${encodeURIComponent(`/claim/${slug}`)}`,
    );
    await this.page.locator('[data-test="email-input"]:visible').fill(email);
    await this.page
      .locator('[data-test="password-input"]:visible')
      .fill('Directory-QA!Secure123');
    await this.page
      .locator('[data-test="repeat-password-input"]:visible')
      .fill('Directory-QA!Secure123');
    await this.page.locator('[data-test="auth-submit-button"]:visible').click();
    await expect(
      this.page.getByText('We sent you a confirmation email.'),
    ).toBeVisible();
  }

  async confirmEmail(email: string) {
    const mailbox = new Mailbox(this.page);
    let html: string | undefined;
    await expect
      .poll(async () => {
        html = (await mailbox.getEmail(email, { deleteAfter: false }))?.HTML;
        return Boolean(html);
      })
      .toBe(true);
    const href = parse(html!).querySelector('a')?.getAttribute('href');
    expect(href).toBeTruthy();
    await this.page.goto(href!);
  }

  async claim(slug: string) {
    await expect(this.page).toHaveURL(new RegExp(`/claim/${slug}$`));
    await this.page.locator('[data-test="claim-business"]:visible').click();
    await expect(this.page).toHaveURL(new RegExp(`/home/businesses/${slug}$`));
  }

  async saveDescription(description: string) {
    await this.page
      .locator('textarea[name="description"]:visible')
      .fill(description);
    await this.page.locator('input[name="employee_count"]:visible').fill('');
    await this.page.locator('input[name="founded_year"]:visible').fill('');
    await this.page.locator('[data-test="save-business"]:visible').click();
    await expect(this.page.getByRole('status')).toContainText(
      'Informações salvas com sucesso.',
    );
  }
}

test('confirma e-mail, reivindica empresa e preserva a edição pública', async ({
  page,
  browser,
}) => {
  const admin = getSupabaseAdminClient();
  const slug = `claim-e2e-${randomUUID()}`;
  const email = `owner@${slug}.example`;
  const description = 'Perfil atualizado após confirmar o domínio corporativo.';
  let userId: string | undefined;
  const { error } = await admin.from('businesses').insert({
    name: slug,
    slug,
    website: `https://${slug}.example`,
    tier: 'unclaimed',
    account_id: null,
  });
  expect(error).toBeNull();

  try {
    const owner = new DirectoryOwnerPage(page);
    await owner.signUp(email, slug);
    await owner.confirmEmail(email);
    await owner.claim(slug);
    await owner.saveDescription(description);
    await page.reload();
    await expect(
      page.locator('textarea[name="description"]:visible'),
    ).toHaveValue(description);

    const { data: business, error: readError } = await admin
      .from('businesses')
      .select('account_id,tier,employee_count,founded_year')
      .eq('slug', slug)
      .single();
    expect(readError).toBeNull();
    expect(business?.tier).toBe('claimed');
    expect(business?.employee_count).toBeNull();
    expect(business?.founded_year).toBeNull();
    userId = business?.account_id;

    const guestContext = await browser.newContext();
    try {
      const guest = await guestContext.newPage();
      await guest.goto(`/company/${slug}`);
      await expect(guest.locator('body')).toContainText(description);
    } finally {
      await guestContext.close();
    }
  } finally {
    // Only fixtures created by this test are removed.
    await admin.from('businesses').delete().eq('slug', slug);
    if (!userId) {
      const { data } = await admin.auth.admin.listUsers();
      userId = data.users.find((user) => user.email === email)?.id;
    }
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
