-- Aggregate interest, never leads or individual visitor histories.
create table public.business_analytics_daily (
  business_id uuid not null references public.businesses(id) on delete cascade,
  day date not null,
  event text not null check (event in ('view', 'website', 'phone', 'email')),
  count bigint not null default 1 check (count > 0),
  primary key (business_id, day, event)
);
alter table public.business_analytics_daily enable row level security;
revoke all on public.business_analytics_daily from anon, authenticated, service_role;
grant select on public.business_analytics_daily to authenticated;
grant select, insert, update, delete on public.business_analytics_daily to service_role;
create policy business_analytics_owner_read on public.business_analytics_daily
  for select to authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id
      and b.account_id = (select auth.uid()) and b.tier in ('highlight', 'spotlight'))
  );
create policy restrict_mfa_business_analytics on public.business_analytics_daily
  as restrictive to authenticated using (public.is_mfa_compliant());

-- Short-lived daily HMACs are inaccessible to visitors and business owners.
create table public.business_analytics_dedupe (
  visitor_hash text not null check (visitor_hash ~ '^[a-f0-9]{64}$'),
  day date not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  event text not null check (event in ('view', 'website', 'phone', 'email')),
  primary key (visitor_hash, day, business_id, event)
);
create index business_analytics_dedupe_business on public.business_analytics_dedupe(business_id);
create index business_analytics_dedupe_day on public.business_analytics_dedupe(day);
alter table public.business_analytics_dedupe enable row level security;
revoke all on public.business_analytics_dedupe from anon, authenticated, service_role;
grant select, insert, delete on public.business_analytics_dedupe to service_role;

-- Invoker privileges: only the trusted ingestion server may execute or write.
create or replace function public.record_business_interest(
  p_business_id uuid, p_event text, p_visitor_hash text, p_actor_id uuid default null,
  p_day date default ((statement_timestamp() at time zone 'UTC')::date)
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  today date := (statement_timestamp() at time zone 'UTC')::date;
  inserted integer;
begin
  if p_day is null or p_day not in (today, today - 1) then
    raise exception 'Invalid interest day' using errcode = '22023';
  end if;
  if p_event not in ('view', 'website', 'phone', 'email') or p_event is null
    or p_visitor_hash is null or p_visitor_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid interest event' using errcode = '22023';
  end if;
  if not exists (select 1 from public.businesses b where b.id = p_business_id
    and (p_actor_id is null or b.account_id is distinct from p_actor_id)
    and (p_event = 'view' or (p_event = 'website' and nullif(b.website, '') is not null)
      or (p_event = 'phone' and nullif(b.phone, '') is not null)
      or (p_event = 'email' and nullif(b.email, '') is not null))) then
    return;
  end if;
  -- Serialize one daily network hash, including parallel retries and profiles.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_visitor_hash, 0));
  if (select count(*) from public.business_analytics_dedupe
    where visitor_hash = p_visitor_hash and day = p_day) >= 200 then return; end if;
  insert into public.business_analytics_dedupe(visitor_hash, day, business_id, event)
    values (p_visitor_hash, p_day, p_business_id, p_event) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted > 0 then
    insert into public.business_analytics_daily(business_id, day, event)
      values (p_business_id, p_day, p_event)
      on conflict (business_id, day, event) do update
      set count = public.business_analytics_daily.count + 1;
  end if;
  -- Keep current and previous UTC day keys to dedupe requests crossing midnight.
  delete from public.business_analytics_dedupe where day < today - 1;
end;
$$;
revoke all on function public.record_business_interest(uuid, text, text, uuid, date) from public, anon, authenticated;
grant execute on function public.record_business_interest(uuid, text, text, uuid, date) to service_role;
comment on table public.business_analytics_daily is 'Daily indicative profile views and contact clicks; owner read requires Highlight or Spotlight.';
comment on table public.business_analytics_dedupe is 'Short-lived daily salted network hashes, no raw IPs, cookies, user agents or contact destinations. Cleaned on ingestion.';
