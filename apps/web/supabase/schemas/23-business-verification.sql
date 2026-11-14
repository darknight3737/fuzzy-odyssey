create table public.business_verification_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  draft jsonb,
  domain text not null,
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  support_message text,
  support_status text check (support_status in ('pending', 'rejected', 'approved')),
  email_digest text,
  email_expires_at timestamptz,
  email_sent_at timestamptz,
  email_attempts integer not null default 0,
  completed_at timestamptz,
  method text check (method in ('badge', 'account_email', 'email', 'dns', 'support')),
  result_slug text,
  check ((business_id is null) <> (draft is null))
);
create index business_verification_requests_account_idx
  on public.business_verification_requests(account_id, created_at desc);
alter table public.business_verification_requests enable row level security;
revoke all on public.business_verification_requests from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.business_verification_requests to service_role;

create or replace function public.create_proven_marketplace_offering(p_payload jsonb, actor uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  category uuid;
  categories uuid[];
  vendor uuid := nullif(p_payload->>'vendor_business_id', '')::uuid;
  kind text := p_payload->>'offering_kind';
  profile_name text := trim(p_payload->>'name');
  site text := trim(p_payload->>'website');
  site_domain text;
  site_path text;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;
  if not exists(select 1 from public.accounts where id = actor and is_personal_account) then
    raise exception 'Personal account required';
  end if;
  if coalesce(p_payload->>'slug', '') !~ '^[a-z0-9][a-z0-9-]{1,160}$'
     or length(trim(coalesce(p_payload->>'description', ''))) not between 30 and 10000
     or length(coalesce(profile_name, '')) not between 2 and 160
     or coalesce(kind, '') not in ('service', 'software') then
    raise exception 'Invalid profile details';
  end if;

  site_domain := regexp_replace(lower(substring(site from '(?i)^https://([a-z0-9.-]+)(?:[/?#]|$)')), '^www[.]', '');
  if site_domain is null or site_domain !~ '^[a-z0-9-]+([.][a-z0-9-]+)+$'
     or length(site) > 2048 or site ~ '[[:space:][:cntrl:]]' or strpos(site, chr(92)) > 0 then
    raise exception 'Valid HTTPS website required';
  end if;
  if vendor is not null and not exists(
    select 1 from public.businesses
      where id = vendor and account_id = actor and offering_kind = 'service' and kind = 'software'
  ) then
    raise exception 'Vendor must belong to your account';
  end if;
  select coalesce(array_agg(value::uuid), array[]::uuid[]) into categories
    from jsonb_array_elements_text(coalesce(p_payload->'category_ids', '[]'::jsonb));
  if cardinality(categories) not between 1 and 10 or exists(
    select 1 from unnest(categories) c
      left join public.categories x on x.id = c
      where x.id is null or not x.is_active
  ) then
    raise exception 'Invalid categories';
  end if;

  site_path := rtrim(regexp_replace(split_part(split_part(site, '#', 1), '?', 1), '(?i)^https://[^/]+', ''), '/');

  -- Serialize new listings per domain while allowing several distinct products
  -- to share their vendor's site. Existing imported listings participate in the lookup.
  perform pg_advisory_xact_lock(hashtextextended('selletive:offering:' || site_domain, 0));
  if exists(
    select 1 from public.businesses b
    where b.offering_kind = kind
      and regexp_replace(lower(substring(b.website from '(?i)^(?:https?://)?([a-z0-9.-]+)(?:[/:?#]|$)')), '^www[.]', '') = site_domain
      and (
        kind = 'service'
        or lower(trim(b.name)) = lower(profile_name)
        or (site_path <> '' and
            rtrim(regexp_replace(split_part(split_part(b.website, '#', 1), '?', 1),
              '(?i)^(?:https?://)?[^/]+', ''), '/') = site_path)
      )
  ) then
    raise exception using errcode = 'SL002', message = 'An existing listing matches this profile';
  end if;

  insert into public.businesses(account_id, name, slug, website, description, offering_kind, vendor_business_id, tier)
  values(actor, profile_name, p_payload->>'slug', site, trim(p_payload->>'description'), kind, vendor, 'claimed')
  returning id into new_id;
  foreach category in array categories loop
    insert into public.business_categories(business_id, category_id)
    values(new_id, category) on conflict do nothing;
  end loop;
  return new_id;
end;
$$;

revoke all on function public.create_proven_marketplace_offering(jsonb, uuid) from public, anon, authenticated, service_role;

create function public.complete_business_verification(
  p_request uuid, p_actor uuid, p_method text, p_digest text default null, p_badge_page text default null
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  req public.business_verification_requests%rowtype;
  target public.businesses%rowtype;
  slug_result text;
  new_id uuid;
  current_domain text;
begin
  select * into req from public.business_verification_requests where id = p_request for update;
  if not found or p_actor is null or req.account_id <> p_actor or req.expires_at <= now() then return null; end if;
  if req.completed_at is not null then return req.result_slug; end if;
  if p_method is null or p_method not in ('badge','account_email','email','dns','support') then return null; end if;
  if p_method = 'support' and req.support_status is distinct from 'pending' then return null; end if;
  if p_method = 'account_email' and not exists (
    select 1 from auth.users where id = p_actor and email_confirmed_at is not null
      and deleted_at is null and split_part(lower(email), '@', 2) = req.domain
  ) then return null; end if;
  if p_method <> 'support' and req.domain = '' then return null; end if;
  if p_method in ('account_email', 'email') and req.domain = any(array[
    'gmail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','live.com',
    'proton.me','protonmail.com','uol.com.br','bol.com.br'
  ]) then return null; end if;
  if p_method = 'email' then
    if req.email_expires_at is null or req.email_expires_at <= now() or req.email_attempts >= 5 then return null; end if;
    update public.business_verification_requests set email_attempts = email_attempts + 1 where id = req.id;
    if p_digest is null or req.email_digest is distinct from p_digest then return null; end if;
  end if;

  if req.business_id is null then
    new_id := public.create_proven_marketplace_offering(req.draft, p_actor);
    select * into strict target from public.businesses where id = new_id;
  else
    select * into target from public.businesses where id = req.business_id for update;
    if not found then return null; end if;
    current_domain := regexp_replace(lower(substring(target.website from '(?i)^https?://([a-z0-9.-]+)(?:[/?#]|$)')), '^www[.]', '');
    if coalesce(current_domain, '') <> req.domain then return null; end if;
    if target.tier = 'unclaimed' and target.account_id is null then
      update public.businesses set account_id = p_actor, tier = 'claimed' where id = target.id returning * into target;
    elsif target.account_id is distinct from p_actor or p_method <> 'badge' then
      return null;
    end if;
  end if;

  if p_method = 'badge' then
    if p_badge_page is null then raise exception 'Badge page required'; end if;
    insert into public.verification_badges(business_id, badge_code, verification_url)
    values(target.id, req.token::text, p_badge_page) returning id into badge_id;
    perform public.attest_business_badge(badge_id, true, target.website);
  end if;
  slug_result := target.slug;

  update public.business_verification_requests set completed_at = now(), method = p_method,
    result_slug = slug_result, email_digest = null,
    support_status = case when p_method = 'support' then 'approved' else null end
  where id = req.id;
  return slug_result;
end;
$$;
revoke all on function public.complete_business_verification(uuid, uuid, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.complete_business_verification(uuid, uuid, text, text, text) to service_role;

create table public.business_verification_email_log (
  account_id uuid not null references public.accounts(id) on delete cascade,
  recipient text not null,
  sent_at timestamptz not null default now()
);
create index on public.business_verification_email_log(account_id, sent_at);
create index on public.business_verification_email_log(recipient, sent_at);
alter table public.business_verification_email_log enable row level security;
revoke all on public.business_verification_email_log from public, anon, authenticated, service_role;

create function public.reserve_business_verification_email(
  p_request uuid, p_actor uuid, p_recipient text, p_digest text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('verification-account:' || p_actor::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('verification-email:' || p_recipient, 0));

  if (select count(*) from public.business_verification_email_log
      where account_id = p_actor and sent_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.business_verification_email_log
      where recipient = p_recipient and sent_at > now() - interval '1 hour') >= 5 then return false; end if;

  update public.business_verification_requests set email_digest = p_digest,
    email_sent_at = now(), email_expires_at = now() + interval '10 minutes', email_attempts = 0
  where id = p_request and account_id = p_actor and completed_at is null and expires_at > now()
    and (email_sent_at is null or email_sent_at <= now() - interval '1 minute')
    and split_part(p_recipient, '@', 2) = domain;
  if not found then return false; end if;

  insert into public.business_verification_email_log(account_id, recipient) values (p_actor, p_recipient);
  return true;
end;
$$;
revoke all on function public.reserve_business_verification_email(uuid, uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.reserve_business_verification_email(uuid, uuid, text, text) to service_role;

create function public.resolve_business_badge(p_token uuid) returns text
language sql stable security definer set search_path = ''
as $$
  select business.slug
  from public.verification_badges badge
  join public.businesses business on business.id = badge.business_id
  where badge.badge_code = p_token::text and badge.is_verified
    and business.verification_status = 'verified';
$$;
revoke all on function public.resolve_business_badge(uuid) from public, anon, authenticated, service_role;
grant execute on function public.resolve_business_badge(uuid) to anon, authenticated;
