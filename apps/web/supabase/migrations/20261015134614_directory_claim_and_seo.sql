-- Imported businesses do not need artificial user accounts.
alter table public.businesses alter column account_id drop not null;

-- Trust signals and ownership can only be changed by controlled database code.
create or replace function public.protect_business_trust_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if TG_OP = 'INSERT' then
      if new.tier not in ('unclaimed', 'claimed') or new.verification_status <> 'pending' or new.domain_rating <> 0 then
        raise exception 'Trust fields are managed by the platform';
      end if;
    elsif new.account_id is distinct from old.account_id
       or new.tier is distinct from old.tier
       or new.verification_status is distinct from old.verification_status
       or new.domain_rating is distinct from old.domain_rating then
      raise exception 'Trust fields are managed by the platform';
    end if;
  end if;
  return new;
end;
$$;
create trigger protect_business_trust_fields before insert or update on public.businesses
for each row execute function public.protect_business_trust_fields();

-- Atomic claim: use the authoritative confirmed email, never JWT user_metadata.
-- The row lock ensures only one claimant can win a concurrent claim.
create or replace function public.claim_business(business_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  confirmed_email text;
  email_domain text;
  website_domain text;
  target public.businesses%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select lower(email) into confirmed_email from auth.users
    where id = actor and email_confirmed_at is not null and deleted_at is null;
  if confirmed_email is null then raise exception 'Confirm your corporate email first'; end if;
  select * into target from public.businesses where slug = business_slug for update;
  if not found then raise exception 'Business not found'; end if;
  if target.tier <> 'unclaimed' then raise exception 'This profile has already been claimed'; end if;
  email_domain := split_part(confirmed_email, '@', 2);
  website_domain := lower(substring(target.website from '^https?://([^/:?#]+)'));
  website_domain := regexp_replace(website_domain, '^www\.', '');
  if website_domain is null or email_domain <> website_domain
    or email_domain = any(array['gmail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','live.com','proton.me','protonmail.com','uol.com.br','bol.com.br']) then
    raise exception 'Use a confirmed email matching the company website domain';
  end if;
  if not exists(select 1 from public.accounts where id = actor and is_personal_account) then
    raise exception 'Personal account required';
  end if;
  update public.businesses set account_id = actor, tier = 'claimed', updated_at = now() where id = target.id;
  return target.id;
end;
$$;
revoke all on function public.claim_business(text) from public, anon;
grant execute on function public.claim_business(text) to authenticated;

-- Public reviews must never expose reviewer email. Moderation is independent
-- of the reviewed company and only authenticated, attributable submissions enter pending.
drop policy reviews_insert_anon on public.reviews;
drop policy reviews_insert_auth on public.reviews;
create policy reviews_insert_auth on public.reviews for insert to authenticated
with check (status = 'pending' and user_id = (select auth.uid()) and not is_verified
  and not exists(select 1 from public.businesses b where b.id = business_id and b.account_id = (select auth.uid())));
drop policy reviews_update_self on public.reviews;
drop policy reviews_delete_self on public.reviews;
create policy reviews_moderate_admin on public.reviews for update to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy reviews_delete_admin on public.reviews for delete to authenticated using (public.is_super_admin());
revoke select on public.reviews from anon, authenticated;
grant select(id, business_id, user_id, reviewer_name, rating, title, content, status, is_verified, created_at, updated_at) on public.reviews to anon, authenticated;

-- Read-only directory of real category/location combinations for pSEO.
create or replace view public.directory_pages with (security_invoker = true) as
select c.slug as category_slug, c.name as category_name,
       l.slug as location_slug, l.name as location_name,
       count(distinct b.id) as business_count, max(b.updated_at) as updated_at
from public.businesses b
join public.business_categories bc on bc.business_id = b.id
join public.categories c on c.id = bc.category_id and c.is_active
join public.business_locations bl on bl.business_id = b.id
join public.locations l on l.id = bl.location_id
group by c.slug, c.name, l.slug, l.name;
grant select on public.directory_pages to anon, authenticated;

-- Support filters and deterministic directory pagination.
create index if not exists idx_businesses_name_id on public.businesses(name, id);
create index if not exists idx_businesses_tier on public.businesses(tier);
create index if not exists idx_reviews_approved_business on public.reviews(business_id) where status = 'approved';

-- Explicit grants are required because the boilerplate revokes anonymous schema access.
grant usage on schema public to anon;
grant select on public.businesses, public.categories, public.category_aliases,
  public.locations, public.business_categories, public.business_locations,
  public.business_services, public.business_awards, public.business_cases to anon, authenticated;
create policy reviews_read_admin on public.reviews for select to authenticated using (public.is_super_admin());
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 200),
  email text not null check (length(email) between 3 and 320),
  message text not null check (length(message) between 10 and 10000),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant insert(name,email,message) on public.contact_messages to anon,authenticated;
grant select on public.contact_messages to authenticated;
create policy contact_messages_submit on public.contact_messages for insert to anon,authenticated with check (true);
create policy contact_messages_admin_read on public.contact_messages for select to authenticated using(public.is_super_admin());
create or replace function public.search_directory(search_term text default '', category_slug text default null, location_slug text default null)
returns setof public.businesses language sql stable security invoker set search_path = '' as $$
 select b.* from public.businesses b
 where (nullif(trim(search_term),'') is null
   or b.name ilike '%' || left(search_term,120) || '%'
   or b.description ilike '%' || left(search_term,120) || '%'
   or exists(select 1 from public.business_categories bc join public.categories c on c.id=bc.category_id
     where bc.business_id=b.id and c.is_active and c.name ilike '%' || left(search_term,120) || '%'))
 and (category_slug is null or exists(select 1 from public.business_categories bc join public.categories c on c.id=bc.category_id where bc.business_id=b.id and c.slug=category_slug and c.is_active))
 and (location_slug is null or exists(select 1 from public.business_locations bl join public.locations l on l.id=bl.location_id where bl.business_id=b.id and l.slug=location_slug))
 order by b.tier desc,b.name,b.id;
$$;
revoke all on function public.search_directory(text,text,text) from public;
grant execute on function public.search_directory(text,text,text) to anon,authenticated;
