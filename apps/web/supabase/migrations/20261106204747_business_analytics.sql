  create table "public"."business_analytics_daily" (
    "business_id" uuid not null,
    "day" date not null,
    "event" text not null,
    "count" bigint not null default 1
      );


alter table "public"."business_analytics_daily" enable row level security;


  create table "public"."business_analytics_dedupe" (
    "visitor_hash" text not null,
    "day" date not null,
    "business_id" uuid not null,
    "event" text not null
      );


alter table "public"."business_analytics_dedupe" enable row level security;

CREATE UNIQUE INDEX business_analytics_daily_pkey ON public.business_analytics_daily USING btree (business_id, day, event);

CREATE INDEX business_analytics_dedupe_day ON public.business_analytics_dedupe USING btree (day);

CREATE UNIQUE INDEX business_analytics_dedupe_pkey ON public.business_analytics_dedupe USING btree (visitor_hash, day, business_id, event);

alter table "public"."business_analytics_daily" add constraint "business_analytics_daily_pkey" PRIMARY KEY using index "business_analytics_daily_pkey";

alter table "public"."business_analytics_dedupe" add constraint "business_analytics_dedupe_pkey" PRIMARY KEY using index "business_analytics_dedupe_pkey";

alter table "public"."business_analytics_daily" add constraint "business_analytics_daily_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_analytics_daily" validate constraint "business_analytics_daily_business_id_fkey";

alter table "public"."business_analytics_daily" add constraint "business_analytics_daily_count_check" CHECK ((count > 0)) not valid;

alter table "public"."business_analytics_daily" validate constraint "business_analytics_daily_count_check";

alter table "public"."business_analytics_daily" add constraint "business_analytics_daily_event_check" CHECK ((event = ANY (ARRAY['view'::text, 'website'::text, 'phone'::text, 'email'::text]))) not valid;

alter table "public"."business_analytics_daily" validate constraint "business_analytics_daily_event_check";

alter table "public"."business_analytics_dedupe" add constraint "business_analytics_dedupe_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_analytics_dedupe" validate constraint "business_analytics_dedupe_business_id_fkey";

alter table "public"."business_analytics_dedupe" add constraint "business_analytics_dedupe_event_check" CHECK ((event = ANY (ARRAY['view'::text, 'website'::text, 'phone'::text, 'email'::text]))) not valid;

alter table "public"."business_analytics_dedupe" validate constraint "business_analytics_dedupe_event_check";

alter table "public"."business_analytics_dedupe" add constraint "business_analytics_dedupe_visitor_hash_check" CHECK ((visitor_hash ~ '^[a-f0-9]{64}$'::text)) not valid;

alter table "public"."business_analytics_dedupe" validate constraint "business_analytics_dedupe_visitor_hash_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.record_business_interest(p_business_id uuid, p_event text, p_visitor_hash text, p_actor_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  today date := (statement_timestamp() at time zone 'UTC')::date;
  inserted integer;
begin
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
    where visitor_hash = p_visitor_hash and day = today) >= 200 then return; end if;
  insert into public.business_analytics_dedupe(visitor_hash, day, business_id, event)
    values (p_visitor_hash, today, p_business_id, p_event) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted > 0 then
    insert into public.business_analytics_daily(business_id, day, event)
      values (p_business_id, today, p_event)
      on conflict (business_id, day, event) do update
      set count = public.business_analytics_daily.count + 1;
  end if;
  -- Keep only today's pseudonymous dedupe keys; aggregates contain no visitor keys.
  delete from public.business_analytics_dedupe where day < today;
end;
$function$
;

revoke all on public.business_analytics_daily from anon, authenticated, service_role;
revoke all on public.business_analytics_dedupe from anon, authenticated, service_role;
revoke all on function public.record_business_interest(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.record_business_interest(uuid,text,text,uuid) to service_role;
grant select on table "public"."business_analytics_daily" to "authenticated";

grant delete on table "public"."business_analytics_daily" to "service_role";

grant insert on table "public"."business_analytics_daily" to "service_role";

grant select on table "public"."business_analytics_daily" to "service_role";

grant update on table "public"."business_analytics_daily" to "service_role";

grant delete on table "public"."business_analytics_dedupe" to "service_role";

grant insert on table "public"."business_analytics_dedupe" to "service_role";

grant select on table "public"."business_analytics_dedupe" to "service_role";


  create policy "business_analytics_owner_read"
  on "public"."business_analytics_daily"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = business_analytics_daily.business_id) AND (b.account_id = ( SELECT auth.uid() AS uid)) AND (b.tier = ANY (ARRAY['highlight'::public.business_tier, 'spotlight'::public.business_tier]))))));



  create policy "restrict_mfa_business_analytics"
  on "public"."business_analytics_daily"
  as restrictive
  for all
  to authenticated
using (public.is_mfa_compliant());



