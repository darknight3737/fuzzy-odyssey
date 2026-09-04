import { type Page, expect, test } from '@playwright/test';

import { AuthPageObject } from '../authentication/auth.po';

/**
 * `useIsMobile()` switches at 1024px, so between 768px and 1023px the sidebar
 * is an off-canvas Sheet that opens only from the mobile top bar. That band is
 * invisible to the rest of the suite — every other project runs at 1280px —
 * and it is exactly where the two chrome surfaces can disagree: hide the top
 * bar too early and there is no way to reach navigation, hide the sidebar too
 * late and both paint at once.
 */
const TABLET = { width: 900, height: 800 };
const DESKTOP = { width: 1280, height: 800 };

/**
 * Target the container rather than the `[data-slot="sidebar"]` wrapper. The
 * wrapper's only in-flow child is a zero-height spacer — the sidebar proper is
 * `fixed` and contributes nothing to its parent's box — so the wrapper has no
 * bounding box and always reads as hidden.
 */
function desktopSidebar(page: Page) {
  return page.locator('[data-slot="sidebar-container"]');
}

test.describe('sidebar navigation breakpoint', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPageObject(page);

    await auth.loginAsUser({
      email: 'test@makerkit.dev',
      next: '/home',
    });
  });

  test('the sidebar is reachable between the md and lg breakpoints', async ({
    page,
  }) => {
    await page.setViewportSize(TABLET);

    const trigger = page.locator('[data-test="mobile-sidebar-trigger"]');

    // The trigger is the only way into navigation at this width.
    await expect(trigger).toBeVisible();

    // The desktop sidebar must not paint beside it.
    await expect(desktopSidebar(page)).toBeHidden();

    await trigger.click();

    // Opening it mounts the sidebar as a Sheet.
    await expect(page.locator('[data-mobile="true"]')).toBeVisible();
  });

  test('the desktop sidebar replaces the trigger above lg', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);

    await expect(
      page.locator('[data-test="mobile-sidebar-trigger"]'),
    ).toBeHidden();

    await expect(desktopSidebar(page)).toBeVisible();
  });
});
