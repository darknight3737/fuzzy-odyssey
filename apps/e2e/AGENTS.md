# End-to-End Testing

## Skills

For E2E test implementation:
- `/playwright-e2e` - Test patterns and Page Objects

## Running Tests

```bash
# Single file (preferred)
pnpm --filter web-e2e exec playwright test <name> --workers=1

# All tests
pnpm test
```

## Page Object Pattern (Required)

```typescript
export class AuthPageObject {
  constructor(private readonly page: Page) {}

  async signIn(params: { email: string; password: string }) {
    await this.page.fill('input[name="email"]', params.email);
    await this.page.fill('input[name="password"]', params.password);
    await this.page.click('button[type="submit"]');
  }
}
```

## Selectors

Always use `data-test` attributes:

```typescript
await this.page.click('[data-test="submit-button"]:visible');
```

### Always scope to `:visible`

Cache Components enables React's `<Activity>`, so the route you navigated away
from stays **mounted and hidden** rather than unmounting. Its DOM is still there,
at zero size, so a bare `data-test` selector matches twice after any navigation.

The two failure modes look nothing alike:

- `page.locator()` / `getByTestId()` are strict — you get a violation naming
  both elements. Annoying, but it tells you what is wrong.
- `page.click()` / `page.fill()` are **not** strict. They take the first match,
  which is often the invisible stale one, then wait for it to become visible
  until the test times out. No error, no clue, 120 seconds gone.

Scope containers as well as leaves — scoping a dialog disambiguates everything
inside it:

```typescript
await this.page.fill(
  '[data-test="create-team-form"]:visible [data-test="team-name-input"]',
  name,
);
```

If a test hangs on an element you can plainly see in the screenshot, count the
matches first: `await page.locator(sel).count()`.

### The dev overlay can intercept clicks

Tests run against `next dev`, so the Next issues badge is part of the page. It
sits bottom-left — on top of a collapsed sidebar's account trigger — and swallows
clicks aimed at anything underneath. The symptom is `locator.click` timing out
after resolving to exactly one element, which reads like a product bug.

It grows with the issue count, so a route that was fine at "1 Issue" can start
failing at "2 Issues". Treat a dev-overlay error as a broken build: fix the
underlying issue rather than working around the badge. `export const instant =
false` hides an error from `next build` but **not** from the overlay, so an
opted-out route can still break your suite.

## Reliability with `toPass()`

```typescript
await expect(async () => {
  const response = await this.page.waitForResponse(
    resp => resp.url().includes('auth/v1/user')
  );
  expect(response.status()).toBe(200);
}).toPass();
```

## Test Organization

```
tests/
├── authentication/
├── billing/
├── *.po.ts          # Page Objects
└── utils/
```
