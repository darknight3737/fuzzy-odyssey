create or replace function public.create_marketplace_offering(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_id uuid;
  category uuid;
  categories uuid[];
  vendor uuid := nullif(p_payload->>'vendor_business_id', '')::uuid;
  kind text := p_payload->>'offering_kind';
  profile_name text := trim(p_payload->>'name');
  site text := trim(p_payload->>'website');
  site_domain text;
  site_path text;
  email_domain text;
begin
  if actor is null or not public.is_mfa_compliant() then
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
  select split_part(lower(email), '@', 2) into email_domain
    from auth.users
    where id = actor and email_confirmed_at is not null and deleted_at is null;
  if email_domain is distinct from site_domain
     or email_domain = any(array['gmail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','live.com','proton.me','protonmail.com','uol.com.br','bol.com.br']) then
    raise exception using errcode = 'SL001', message = 'Use a confirmed email matching the website domain';
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

revoke all on function public.create_marketplace_offering(jsonb) from public, anon;
grant execute on function public.create_marketplace_offering(jsonb) to authenticated;

-- New marketplace profiles must go through the checked creation function.
revoke insert on table public.businesses from authenticated;
drop policy businesses_insert_self on public.businesses;
