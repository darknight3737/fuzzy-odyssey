/*
 * -------------------------------------------------------
 * Section: Selletive Schema (Businesses, Categories, Locations, Reviews, Verification)
 * Aligned with Makerkit multi-tenant model via public.accounts and RLS helpers
 * -------------------------------------------------------
 */

-- Enums
create type public.business_tier as enum ('unclaimed', 'claimed', 'verified', 'highlight', 'spotlight');

create type public.verification_status as enum ('pending', 'verified', 'rejected');

create type public.review_status as enum ('pending', 'approved', 'rejected');

create type public.location_type as enum ('city', 'state', 'country');

create type public.response_status as enum ('active', 'hidden');

-- Tables

-- Businesses
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,

  name text not null,
  slug text not null unique,
  description text,
  website text,
  phone text,
  email text,
  address jsonb,
  logo_url text,
  cover_image_url text, -- tier-gated in UI (highlight/spotlight)

  employee_count integer,
  works_remotely boolean not null default false,
  founded_year integer,
  business_languages text[] not null default '{}',

  contact_enabled boolean not null default false, -- tier-gated in UI (highlight/spotlight)
  tier public.business_tier not null default 'unclaimed',
  verification_status public.verification_status not null default 'pending',
  domain_rating integer not null default 0 check (domain_rating >= 0),

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_businesses_account on public.businesses(account_id);

-- Categories (hierarchical)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references public.categories(id) on delete set null,
  level integer not null check (level between 1 and 3),
  icon text,
  is_active boolean not null default true,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_categories_parent on public.categories(parent_id);
create index if not exists idx_categories_level on public.categories(level);

-- Category Aliases (SEO)
create table if not exists public.category_aliases (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  alias_slug text not null unique,
  alias_name text not null,
  is_primary boolean not null default false,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_category_aliases_category on public.category_aliases(category_id);

-- Business <-> Categories (junction)
create table if not exists public.business_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  display_order integer not null default 0,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz,

  unique (business_id, category_id)
);

create index if not exists idx_business_categories_business on public.business_categories(business_id);
create index if not exists idx_business_categories_category on public.business_categories(category_id);

-- Locations (hierarchical)
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type public.location_type not null,
  parent_id uuid references public.locations(id) on delete set null,
  country_code text,
  state_code text,
  coordinates point,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_locations_parent on public.locations(parent_id);
create index if not exists idx_locations_type on public.locations(type);

-- Business <-> Locations (junction)
create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  is_primary boolean not null default false,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz,

  unique (business_id, location_id)
);

create index if not exists idx_business_locations_business on public.business_locations(business_id);
create index if not exists idx_business_locations_location on public.business_locations(location_id);

-- Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references public.accounts(id) on delete set null, -- nullable for anonymous reviews
  reviewer_name text not null,
  reviewer_email text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  content text,
  status public.review_status not null default 'pending',
  is_verified boolean not null default false,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_reviews_business on public.reviews(business_id);
create index if not exists idx_reviews_status on public.reviews(status);

-- Review Responses (by business team members)
create table if not exists public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.accounts(id) on delete cascade,
  response_text text not null,
  status public.response_status not null default 'active',

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_review_responses_review on public.review_responses(review_id);

-- Verification Badges
create table if not exists public.verification_badges (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  badge_code text not null unique,
  verification_url text,
  is_verified boolean not null default false,
  verified_at timestamptz,
  last_checked timestamptz,

  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_verification_badges_business on public.verification_badges(business_id);

-- Triggers: timestamps and user tracking
create trigger trigger_set_timestamps_on_businesses
before insert or update on public.businesses
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_businesses
before insert or update on public.businesses
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_categories
before insert or update on public.categories
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_categories
before insert or update on public.categories
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_category_aliases
before insert or update on public.category_aliases
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_category_aliases
before insert or update on public.category_aliases
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_business_categories
before insert or update on public.business_categories
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_business_categories
before insert or update on public.business_categories
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_locations
before insert or update on public.locations
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_locations
before insert or update on public.locations
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_business_locations
before insert or update on public.business_locations
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_business_locations
before insert or update on public.business_locations
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_reviews
before insert or update on public.reviews
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_reviews
before insert or update on public.reviews
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_review_responses
before insert or update on public.review_responses
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_review_responses
before insert or update on public.review_responses
for each row execute procedure public.trigger_set_user_tracking();

create trigger trigger_set_timestamps_on_verification_badges
before insert or update on public.verification_badges
for each row execute procedure public.trigger_set_timestamps();

create trigger trigger_set_user_tracking_on_verification_badges
before insert or update on public.verification_badges
for each row execute procedure public.trigger_set_user_tracking();

-- RLS Policies

-- Businesses
alter table public.businesses enable row level security;

-- Public read (anon + authenticated)
create policy businesses_read_anon on public.businesses for select to anon using (true);
create policy businesses_read_auth on public.businesses for select to authenticated using (true);

-- Manage by team members with appropriate permissions/ownership
create policy businesses_insert_self on public.businesses for insert to authenticated
with check (
  public.has_permission((select auth.uid()), account_id, 'settings.manage'::public.app_permissions)
  or public.is_account_owner(account_id)
  or public.has_role_on_account(account_id, 'owner')
);

create policy businesses_update_self on public.businesses for update to authenticated
using (
  public.has_permission((select auth.uid()), account_id, 'settings.manage'::public.app_permissions)
  or public.is_account_owner(account_id)
  or public.has_role_on_account(account_id, 'owner')
)
with check (
  public.has_permission((select auth.uid()), account_id, 'settings.manage'::public.app_permissions)
  or public.is_account_owner(account_id)
  or public.has_role_on_account(account_id, 'owner')
);

create policy businesses_delete_self on public.businesses for delete to authenticated
using (
  public.has_permission((select auth.uid()), account_id, 'settings.manage'::public.app_permissions)
  or public.is_account_owner(account_id)
  or public.has_role_on_account(account_id, 'owner')
);

-- Categories (public read; write by super admin only)
alter table public.categories enable row level security;
create policy categories_read_anon on public.categories for select to anon using (true);
create policy categories_read_auth on public.categories for select to authenticated using (true);
create policy categories_write_admin on public.categories for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

-- Category Aliases
alter table public.category_aliases enable row level security;
create policy category_aliases_read_anon on public.category_aliases for select to anon using (true);
create policy category_aliases_read_auth on public.category_aliases for select to authenticated using (true);
create policy category_aliases_write_admin on public.category_aliases for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

-- Business Categories (public read; team manage)
alter table public.business_categories enable row level security;
create policy business_categories_read_anon on public.business_categories for select to anon using (true);
create policy business_categories_read_auth on public.business_categories for select to authenticated using (true);

create policy business_categories_insert_self on public.business_categories for insert to authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_categories_update_self on public.business_categories for update to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
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
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_categories_delete_self on public.business_categories for delete to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

-- Locations (public read; write by super admin only)
alter table public.locations enable row level security;
create policy locations_read_anon on public.locations for select to anon using (true);
create policy locations_read_auth on public.locations for select to authenticated using (true);
create policy locations_write_admin on public.locations for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

-- Business Locations (public read; team manage)
alter table public.business_locations enable row level security;
create policy business_locations_read_anon on public.business_locations for select to anon using (true);
create policy business_locations_read_auth on public.business_locations for select to authenticated using (true);

create policy business_locations_insert_self on public.business_locations for insert to authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_locations_update_self on public.business_locations for update to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
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
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

create policy business_locations_delete_self on public.business_locations for delete to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and (
        public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
        or public.is_account_owner(b.account_id)
        or public.has_role_on_account(b.account_id, 'owner')
      )
  )
);

-- Reviews
alter table public.reviews enable row level security;

-- Public can read only approved reviews
create policy reviews_read_anon on public.reviews for select to anon using (status = 'approved');
create policy reviews_read_auth on public.reviews for select to authenticated
using (
  status = 'approved'
  or exists (
    select 1 from public.businesses b where b.id = business_id and (
      public.has_role_on_account(b.account_id)
    )
  )
);

-- Anyone can submit reviews; they enter pending state
create policy reviews_insert_anon on public.reviews for insert to anon
with check (
  status = 'pending' and user_id is null
);

create policy reviews_insert_auth on public.reviews for insert to authenticated
with check (
  status = 'pending' and (user_id is null or user_id = (select auth.uid()))
);

-- Team can moderate/update/delete reviews of their business
create policy reviews_update_self on public.reviews for update to authenticated
using (
  exists (
    select 1 from public.businesses b where b.id = business_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
)
with check (
  exists (
    select 1 from public.businesses b where b.id = business_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
);

create policy reviews_delete_self on public.reviews for delete to authenticated
using (
  exists (
    select 1 from public.businesses b where b.id = business_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
);

-- Review Responses
alter table public.review_responses enable row level security;

-- Public read only active responses
create policy review_responses_read_anon on public.review_responses for select to anon
using (
  status = 'active'
);

create policy review_responses_read_auth on public.review_responses for select to authenticated
using (
  status = 'active'
  or exists (
    select 1 from public.reviews r
    join public.businesses b on b.id = r.business_id
    where r.id = review_id and public.has_role_on_account(b.account_id)
  )
);

-- Team can create/update/delete responses on their business reviews
create policy review_responses_insert_self on public.review_responses for insert to authenticated
with check (
  exists (
    select 1 from public.reviews r
    join public.businesses b on b.id = r.business_id
    where r.id = review_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
  and user_id = (select auth.uid())
);

create policy review_responses_update_self on public.review_responses for update to authenticated
using (
  exists (
    select 1 from public.reviews r
    join public.businesses b on b.id = r.business_id
    where r.id = review_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
)
with check (
  exists (
    select 1 from public.reviews r
    join public.businesses b on b.id = r.business_id
    where r.id = review_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
);

create policy review_responses_delete_self on public.review_responses for delete to authenticated
using (
  exists (
    select 1 from public.reviews r
    join public.businesses b on b.id = r.business_id
    where r.id = review_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
);

-- Verification Badges (team manage; not public)
alter table public.verification_badges enable row level security;

create policy verification_badges_read_self on public.verification_badges for select to authenticated
using (
  exists (
    select 1 from public.businesses b where b.id = business_id and public.has_role_on_account(b.account_id)
  )
);

create policy verification_badges_insert_self on public.verification_badges for insert to authenticated
with check (
  exists (
    select 1 from public.businesses b where b.id = business_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
);

create policy verification_badges_update_self on public.verification_badges for update to authenticated
using (
  exists (
    select 1 from public.businesses b where b.id = business_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
)
with check (
  exists (
    select 1 from public.businesses b where b.id = business_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
);

create policy verification_badges_delete_self on public.verification_badges for delete to authenticated
using (
  exists (
    select 1 from public.businesses b where b.id = business_id and (
      public.has_permission((select auth.uid()), b.account_id, 'settings.manage'::public.app_permissions)
      or public.is_account_owner(b.account_id)
      or public.has_role_on_account(b.account_id, 'owner')
    )
  )
);


