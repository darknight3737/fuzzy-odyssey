# Web Application

## Route Organization

Localized routes live under `app/[locale]/`; `app/api/` is not localized.
Within `app/[locale]/home/`: `(user)/` is the personal account, `[account]/` is
the team account (addressed by **slug, not ID**).

## Component Organization

- Route-specific: `_components/`
- Route utilities: `_lib/` (client), `_lib/server/` (server)

## Skills

For specialized implementation:
- `/service-builder` - Server side services
- `/server-action-builder` - Server actions
- `/react-form-builder` - Forms with validation

## Next.js 16 Params Pattern

```typescript
// CORRECT - await params directly
async function Page({ params }: Props) {
  const { account } = await params;
}
```

## Data Fetching

- **Server Components** (default): `getSupabaseServerClient()` - RLS enforced
- **Client Components**: `useSupabase()` hook with React Query
- **Admin Client**: Bypasses RLS - requires manual auth validation

## Workspace Contexts

```typescript
// Personal: app/home/(user)
import { useUserWorkspace } from '@kit/accounts/hooks/use-user-workspace';

// Team: app/home/[account]
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
```

Both **suspend** — the contexts hold a promise which the hooks unwrap with
`use()`. Any component calling one needs a `<Suspense>` boundary above it, or it
suspends further up than intended. This is what lets the workspace layouts
render their shell and `children` before the workspace resolves.

## Key Config Files

| Purpose | Location |
|---------|----------|
| Feature flags | `config/feature-flags.config.ts` |
| Paths | `config/paths.config.ts` |
| Personal nav | `config/personal-account-navigation.config.tsx` |
| Team nav | `config/team-account-navigation.config.tsx` |
| i18n | `i18n/request.ts` |

## Internationalization

Always use `Trans` component:

```tsx
import { Trans } from '@kit/ui/trans';
<Trans i18nKey="namespace.key" values={{ name }} />
```

## Security

- Authentication enforced by middleware
- Authorization handled by RLS
- Never pass sensitive data to Client Components
- Never expose server env vars to client

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
