# Supabase Database

## Schema Organization

Schemas in `schemas/` directory with numbered prefixes for dependency ordering.

## Skills

For database implementation:
- `/postgres-expert` - Schema design, RLS, migrations, testing

After any change to RLS, grants, `SECURITY DEFINER` functions, views, or schema in
this directory, run the deep adversarial RLS review during verification:
- `/rls-review` - Statically audits tenant-isolation holes, then proves them (or
  their absence) with runnable pgTAP cross-tenant attack tests.

## Migration Workflow

### New Entities

```bash
# Create schema file
touch schemas/20-feature.sql

# Create migration
pnpm --filter web run supabase migrations new feature_name

# Copy content, apply, generate types
pnpm --filter web supabase migrations up
pnpm supabase:web:typegen
```

### Modify Existing

```bash
# Edit schema, generate diff
pnpm --filter web run supabase:db:diff -f update_feature

# Apply and regenerate
pnpm --filter web supabase migrations up
pnpm supabase:web:typegen
```

## Security Rules

- **ALWAYS enable RLS** on new tables
- **NEVER use SECURITY DEFINER** without explicit access controls
- Use existing helper functions (see `/postgres-expert` skill)
- **NEVER grant table-level `UPDATE` to `authenticated`.** Grant column-level
  UPDATE listing only the user-editable columns. Identity/tenancy columns
  (`id`, `account_id`, and any FK that defines ownership) must be excluded so a
  user cannot re-parent a row into another account via
  `UPDATE ... SET account_id = <other tenant>`. RLS `WITH CHECK` alone does not
  cover this cleanly; column privileges reject it up front.
  - Column privileges are checked only against the statement's `SET` list, so
    `BEFORE` triggers that write `updated_at`/tracking/system columns keep
    working even though `authenticated` lacks UPDATE on them.
  - `service_role` keeps full-table UPDATE for system-managed columns.
  - `migra` (`supabase:db:diff`) does NOT emit column grants — it only detects
    the `REVOKE`. Hand-write the `grant update (cols)` lines into the migration.
- **Revoke from all three roles, `anon` included.** Supabase's defaults grant
  `REFERENCES`, `TRIGGER`, `TRUNCATE` and (PG17+) `MAINTAIN` on every new table
  to `anon`, `authenticated` and `service_role` — before you grant anything and
  with RLS on. `TRUNCATE` bypasses RLS.
  `20260811000000_revoke_residual_privileges.sql` strips these defaults, but
  keep the per-table `revoke` as the readable, local guarantee.
  - Invisible to normal testing — `SELECT` is denied while `TRUNCATE` succeeds.
    Assert it in pgTAP; see `privileges.test.sql` and `/rls-review`.
  - Do not assume `service_role`'s DML makes its `TRUNCATE` redundant. On an
    RPC-only table (`nonces`) it holds no DML at all, so `TRUNCATE` would be the
    only write it could perform.
  - `REVOKE ... ON ALL TABLES IN SCHEMA` only covers tables that already exist,
    so it never substitutes for a per-table `revoke`.
  - The stripped defaults cover objects created by `postgres` (migrations,
    dashboard, pg_meta). Supabase's `supabase_admin` defaults still grant full
    `arwdDxtm` and `postgres` cannot alter them on hosted, so extension-created
    tables in `public` need their own explicit revoke.
- **Prefer `generated always as identity` over `serial`/`bigserial`.** Identity
  columns need no privilege on their sequence, so there is no sequence ACL to
  get wrong. A `serial` column needs `usage` on its sequence for `nextval()`,
  which you must now grant explicitly alongside the table grants:
  `grant usage on sequence public.feature_id_seq to authenticated;`
  - Never grant `update` on a sequence to an API role — it permits `setval()`,
    which can rewind a counter into primary-key collisions. `usage` does not.

## Table Template

```sql
create table if not exists public.feature (
  id uuid unique not null default extensions.uuid_generate_v4(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table "public"."feature" enable row level security;

-- anon belongs here: Supabase's defaults grant it TRUNCATE, which bypasses RLS
revoke all on public.feature from anon, authenticated, service_role;

-- service_role keeps full-table access
grant select, insert, update, delete on table public.feature to service_role;

-- authenticated: full access EXCEPT UPDATE, which is column-scoped so id and
-- account_id (the tenancy link) can never be changed by a user's own UPDATE
grant select, insert, delete on table public.feature to authenticated;
grant update (/* user-editable columns only, NOT id / account_id */)
  on table public.feature to authenticated;

-- Use helper functions for policies
create policy "feature_read" on public.feature for select
  to authenticated using (
    account_id = (select auth.uid()) or
    public.has_role_on_account(account_id)
  );
```

## Commands

```bash
pnpm supabase:web:reset     # Reset database
pnpm supabase:web:typegen   # Generate TypeScript types
pnpm --filter web supabase migrations list  # View migrations
```
