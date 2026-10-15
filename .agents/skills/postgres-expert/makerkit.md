# Makerkit Database Patterns

## Schema Location

All schemas are in `apps/web/supabase/schemas/` with numbered prefixes for dependency ordering.

## Existing Helper Functions - DO NOT Recreate

```sql
-- Account Access Control
public.has_role_on_account(account_id uuid, role_name? text)
public.has_permission(user_id uuid, account_id uuid, permission app_permissions)
public.is_account_owner(account_id uuid)
public.has_active_subscription(account_id uuid)
public.is_team_member(account_id uuid, user_id uuid)
public.can_action_account_member(target_account_id uuid, target_user_id uuid)

-- Administrative
public.is_super_admin()
public.is_aal2()
public.is_mfa_compliant()

-- Configuration
public.is_set(field_name text)
```

## RLS Policy Patterns

### Personal + Team Access

```sql
create policy "table_read" on public.table for select
  to authenticated using (
    account_id = (select auth.uid()) or
    public.has_role_on_account(account_id)
  );
```

### Permission-Based Access

```sql
create policy "table_manage" on public.table for all
  to authenticated using (
    public.has_permission(auth.uid(), account_id, 'feature.manage'::app_permissions)
  );
```

### Storage Bucket Policy

```sql
create policy bucket_policy on storage.objects for all using (
  bucket_id = 'bucket_name'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_role_on_account(kit.get_storage_filename_as_uuid(name))
  )
);
```

## Adding New Permissions

```sql
-- Add to app_permissions enum
ALTER TYPE public.app_permissions ADD VALUE 'feature.manage';
COMMIT;
```

## Standard Table Template and Migration Workflow

Both live in `apps/web/supabase/AGENTS.md` (sections "Table Template" and
"Migration Workflow"). Read them there rather than from memory: that file is the
single source of truth for grants, `on delete` actions, triggers and the
`db:diff` flow, and it changes more often than this skill.

## Security Definer Function Pattern

```sql
create or replace function public.admin_function(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- ALWAYS validate permissions first
  if not public.is_account_owner(target_id) then
    raise exception 'Access denied';
  end if;

  -- Safe to proceed
end;
$$;

grant execute on function public.admin_function(uuid) to authenticated;
```
