/*
 * -------------------------------------------------------
 * Section: Selletive Premium Content (Services, Awards, Cases)
 * Gated by business tier: highlight/spotlight for write operations
 * -------------------------------------------------------
 */

-- Business Services (premium)
create table if not exists public.business_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text not null,
  price_range text,
  delivery_time text,
  is_featured boolean not null default false,
  display_order integer not null default 0,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_business_services_business on public.business_services(business_id);
create index if not exists idx_business_services_featured on public.business_services(is_featured);

-- Business Awards (premium)
create table if not exists public.business_awards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  issuer text not null,
  year integer,
  description text,
  certificate_url text,
  is_featured boolean not null default false,
  display_order integer not null default 0,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_business_awards_business on public.business_awards(business_id);
create index if not exists idx_business_awards_featured on public.business_awards(is_featured);

-- Business Cases (premium)
create table if not exists public.business_cases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  client_name text,
  industry text,
  project_type text,
  description text not null,
  challenge text,
  solution text,
  results text,
  duration text,
  budget_range text,
  images text[] not null default '{}',
  is_featured boolean not null default false,
  display_order integer not null default 0,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_business_cases_business on public.business_cases(business_id);
create index if not exists idx_business_cases_featured on public.business_cases(is_featured);

-- Triggers
create trigger trigger_set_timestamps_on_business_services
before insert or update on public.business_services
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_business_services
before insert or update on public.business_services
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_business_awards
before insert or update on public.business_awards
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_business_awards
before insert or update on public.business_awards
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_business_cases
before insert or update on public.business_cases
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_business_cases
before insert or update on public.business_cases
for each row execute procedure public.trigger_set_user_tracking();

-- RLS
alter table public.business_services enable row level security;
alter table public.business_awards enable row level security;
alter table public.business_cases enable row level security;

-- Public read for premium content
create policy business_services_read_anon on public.business_services for select to anon using (true);
create policy business_services_read_auth on public.business_services for select to authenticated using (true);

create policy business_awards_read_anon on public.business_awards for select to anon using (true);
create policy business_awards_read_auth on public.business_awards for select to authenticated using (true);

create policy business_cases_read_anon on public.business_cases for select to anon using (true);
create policy business_cases_read_auth on public.business_cases for select to authenticated using (true);

-- Tier-gated writes: highlight/spotlight AND team with permissions
-- Helper predicate: business belongs to team, and tier is premium
-- We inline it with EXISTS joins and checks

create policy business_services_insert_self on public.business_services for insert to authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_services_update_self on public.business_services for update to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_services_delete_self on public.business_services for delete to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_awards_insert_self on public.business_awards for insert to authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_awards_update_self on public.business_awards for update to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_awards_delete_self on public.business_awards for delete to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_cases_insert_self on public.business_cases for insert to authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_cases_update_self on public.business_cases for update to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_cases_delete_self on public.business_cases for delete to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.tier in ('highlight','spotlight')
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);


