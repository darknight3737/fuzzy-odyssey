-- Marketplace attributes extend the existing catalog without reclassifying imported rows.
alter table public.businesses
  add column offering_kind text not null default 'service' check (offering_kind in ('service', 'software')),
  add column vendor_business_id uuid references public.businesses(id) on delete set null,
  add column min_budget numeric check (min_budget >= 0),
  add column max_budget numeric check (max_budget >= min_budget),
  add column features text[] not null default '{}',
  add column integrations text[] not null default '{}',
  add column free_trial boolean not null default false,
  add column free_plan boolean not null default false,
  add column portuguese boolean not null default false,
  add column video_url text,
  add column calendar_url text,
  add column custom_cta_label text check(length(custom_cta_label)<=120),
  add column custom_cta_url text check(custom_cta_url ~ '^https://' and length(custom_cta_url)<=2048),
  add column pricing_model text,
  add column deployment text[] not null default '{}',
  add column buyer_sizes text[] not null default '{}',
  add column support_languages text[] not null default '{}',
  add column profile_details jsonb not null default '{}'::jsonb check(jsonb_typeof(profile_details)='object'),
  add constraint businesses_vendor_not_self check (vendor_business_id is null or vendor_business_id <> id);

create index idx_businesses_offering_kind on public.businesses(offering_kind);
create index idx_businesses_vendor on public.businesses(vendor_business_id);
create index idx_businesses_languages on public.businesses using gin(business_languages);
create index idx_businesses_features on public.businesses using gin(features);
create index idx_businesses_integrations on public.businesses using gin(integrations);

-- Explicit sort choices always take precedence; tier only breaks quality ties in relevance.
-- The outer aggregate returns an exact total even when the requested page is empty.
create function public.search_marketplace(p_filters jsonb default '{}', p_limit integer default 24, p_offset integer default 0)
returns jsonb language sql stable security invoker set search_path = '' as $$
with filtered as (
 select b.*, coalesce(r.review_count, 0) as marketplace_review_count,
        coalesce(r.average_rating, 0) as marketplace_average_rating,
        (select count(*) from public.business_cases cs where cs.business_id=b.id) as marketplace_works_count,
        (select l.name from public.business_locations bl join public.locations l on l.id=bl.location_id where bl.business_id=b.id order by bl.is_primary desc,l.name limit 1) as marketplace_location_name
 from public.businesses b
 left join lateral (
   select count(*) as review_count, avg(rating) as average_rating
   from public.reviews where business_id = b.id and status = 'approved'
 ) r on true
 where (nullif(p_filters->>'q','') is null or b.name ilike '%' || left(p_filters->>'q',120) || '%'
        or b.description ilike '%' || left(p_filters->>'q',120) || '%')
   and (nullif(p_filters->>'kind','') is null or b.offering_kind = p_filters->>'kind')
   and (nullif(p_filters->>'category','') is null or exists (select 1 from public.business_categories bc join public.categories c on c.id=bc.category_id where bc.business_id=b.id and c.slug=p_filters->>'category' and c.is_active))
   and (nullif(p_filters->>'location','') is null or exists (select 1 from public.business_locations bl join public.locations l on l.id=bl.location_id where bl.business_id=b.id and l.slug=p_filters->>'location'))
   and (nullif(p_filters->>'min_budget','') is null or b.max_budget >= (p_filters->>'min_budget')::numeric)
   and (nullif(p_filters->>'max_budget','') is null or b.min_budget <= (p_filters->>'max_budget')::numeric)
   and (not (p_filters ? 'languages') or b.business_languages @> array(select jsonb_array_elements_text(p_filters->'languages')))
   and (nullif(p_filters->>'min_team','') is null or b.employee_count >= (p_filters->>'min_team')::integer)
   and (nullif(p_filters->>'max_team','') is null or b.employee_count <= (p_filters->>'max_team')::integer)
   and (coalesce((p_filters->>'remote')::boolean,false) = false or b.works_remotely)
   and (nullif(p_filters->>'founded_before','') is null or b.founded_year <= (p_filters->>'founded_before')::integer)
   and (coalesce((p_filters->>'has_works')::boolean,false) = false or exists(select 1 from public.business_cases x where x.business_id=b.id))
   and (coalesce((p_filters->>'has_awards')::boolean,false) = false or exists(select 1 from public.business_awards x where x.business_id=b.id))
   and (not (p_filters ? 'features') or b.features @> array(select jsonb_array_elements_text(p_filters->'features')))
   and (not (p_filters ? 'integrations') or b.integrations @> array(select jsonb_array_elements_text(p_filters->'integrations')))
   and (coalesce((p_filters->>'free_trial')::boolean,false) = false or b.free_trial)
   and (coalesce((p_filters->>'free_plan')::boolean,false) = false or b.free_plan)
   and (coalesce((p_filters->>'portuguese')::boolean,false) = false or b.portuguese)
   and (nullif(p_filters->>'pricing_model','') is null or b.pricing_model=p_filters->>'pricing_model')
   and (not (p_filters ? 'deployment') or b.deployment @> array(select jsonb_array_elements_text(p_filters->'deployment')))
   and (not (p_filters ? 'buyer_sizes') or b.buyer_sizes @> array(select jsonb_array_elements_text(p_filters->'buyer_sizes')))
   and (not (p_filters ? 'support_languages') or b.support_languages @> array(select jsonb_array_elements_text(p_filters->'support_languages')))
   and (nullif(p_filters->>'min_rating','') is null or coalesce(r.average_rating,0) >= (p_filters->>'min_rating')::numeric)
), paged as (
 select f.*, row_number() over (order by
   case when p_filters->>'sort' = 'name' then f.name end asc,
   case when p_filters->>'sort' = 'rating' then f.marketplace_average_rating end desc,
   case when p_filters->>'sort' = 'reviews' then f.marketplace_review_count end desc,
   case when p_filters->>'sort' = 'price' then f.min_budget end asc nulls last,
   case when p_filters->>'sort' = 'team' then f.employee_count end desc nulls last,
   case when p_filters->>'sort' = 'works' then f.marketplace_works_count end desc,
   case when p_filters->>'sort' = 'newest' then f.created_at end desc nulls last,
   case when coalesce(p_filters->>'sort','relevance') = 'relevance' then round(f.marketplace_average_rating,0) end desc,
   case when coalesce(p_filters->>'sort','relevance') = 'relevance' then f.tier end desc,
   f.name, f.id) as ordinal
 from filtered f
 order by ordinal limit greatest(1, least(coalesce(p_limit,24),100)) offset greatest(coalesce(p_offset,0),0)
)
select jsonb_build_object('total', (select count(*) from filtered), 'items',
 coalesce((select jsonb_agg(jsonb_build_object('business', to_jsonb(p) - 'ordinal' - 'marketplace_review_count' - 'marketplace_average_rating' - 'marketplace_works_count' - 'marketplace_location_name',
 'location_name',p.marketplace_location_name,'works_count',p.marketplace_works_count,'average_rating', p.marketplace_average_rating, 'review_count', p.marketplace_review_count) order by p.ordinal) from paged p), '[]'::jsonb));
$$;
revoke all on function public.search_marketplace(jsonb,integer,integer) from public;
grant execute on function public.search_marketplace(jsonb,integer,integer) to anon, authenticated;

-- Serialize quota checks on the business row so simultaneous inserts cannot exceed a tier limit.
create function public.enforce_case_entitlement() returns trigger language plpgsql set search_path = '' as $$
declare allowed integer; current_tier public.business_tier;
begin
 if current_user not in ('anon','authenticated') then return new; end if;
 select tier into current_tier from public.businesses where id = new.business_id for update;
 allowed := case current_tier when 'claimed' then 1 when 'verified' then 3 when 'highlight' then 15 when 'spotlight' then 15 else 0 end;
 if current_tier in ('claimed','verified') and cardinality(new.images) > 0 and (tg_op='INSERT' or new.images is distinct from old.images) then
   raise exception 'Images require a paid plan';
 end if;
 if (select count(*) from public.business_gallery where business_id=new.business_id) + coalesce((select sum(cardinality(images)) from public.business_cases where business_id=new.business_id and id is distinct from new.id),0) + cardinality(new.images) > 20 then raise exception 'Image limit reached'; end if;
 if tg_op = 'INSERT' and (select count(*) from public.business_cases where business_id = new.business_id) >= allowed then
   raise exception 'Case limit reached for this plan';
 end if;
 return new;
end; $$;
create trigger enforce_case_entitlement before insert or update on public.business_cases for each row execute function public.enforce_case_entitlement();
drop policy business_cases_insert_self on public.business_cases;
drop policy business_cases_update_self on public.business_cases;
create policy business_cases_insert_self on public.business_cases for insert to authenticated with check (
 exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('claimed','verified','highlight','spotlight') and
 (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy business_cases_update_self on public.business_cases for update to authenticated using (
 exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('claimed','verified','highlight','spotlight') and
 (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions)))) with check (
 exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('claimed','verified','highlight','spotlight') and
 (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
-- Re-parenting a case would otherwise move data between accounts.
revoke update on public.business_cases from authenticated;
grant update(title,client_name,industry,project_type,description,challenge,solution,results,duration,budget_range,images,is_featured,display_order) on public.business_cases to authenticated;

-- Keep previously approved reviews and responses public, but gate new submissions.
drop policy reviews_insert_auth on public.reviews;
create policy reviews_insert_auth on public.reviews for insert to authenticated with check (
 status='pending' and user_id=(select auth.uid()) and not is_verified and
 exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('verified','highlight','spotlight') and b.account_id is distinct from (select auth.uid()) and not public.has_role_on_account(b.account_id)));
create policy review_responses_tier_insert on public.review_responses as restrictive for insert to authenticated with check (
 exists(select 1 from public.reviews r join public.businesses b on b.id=r.business_id where r.id=review_id and r.status='approved' and b.tier in ('verified','highlight','spotlight')));
create policy review_responses_tier_update on public.review_responses as restrictive for update to authenticated using (
 exists(select 1 from public.reviews r join public.businesses b on b.id=r.business_id where r.id=review_id and b.tier in ('verified','highlight','spotlight'))) with check (
 exists(select 1 from public.reviews r join public.businesses b on b.id=r.business_id where r.id=review_id and b.tier in ('verified','highlight','spotlight')));
revoke update on public.review_responses from authenticated;
grant update(response_text,status) on public.review_responses to authenticated;

-- Buyer-owned brief; recipients are created by trusted dispatch after eligibility checks.
create table public.lead_briefs (
 id uuid primary key default gen_random_uuid(),
 buyer_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 title text not null check (length(trim(title)) between 3 and 200),
 description text not null check (length(trim(description)) between 10 and 10000),
 budget numeric check (budget >= 0),
 created_at timestamptz not null default now()
);
create table public.lead_recipients (
 brief_id uuid not null references public.lead_briefs(id) on delete cascade,
 business_id uuid not null references public.businesses(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(brief_id,business_id)
);
create index idx_lead_recipients_business on public.lead_recipients(business_id,created_at desc);
alter table public.lead_briefs enable row level security;
alter table public.lead_recipients enable row level security;
revoke all on public.lead_briefs,public.lead_recipients from anon,authenticated,service_role;
grant select,insert on public.lead_briefs to authenticated;
grant select on public.lead_recipients to authenticated;
grant select,insert,update,delete on public.lead_briefs,public.lead_recipients to service_role;
create policy lead_briefs_buyer_insert on public.lead_briefs for insert to authenticated with check(buyer_user_id=(select auth.uid()));
create policy lead_briefs_buyer_read on public.lead_briefs for select to authenticated using(buyer_user_id=(select auth.uid()));
create policy lead_recipients_owner_read on public.lead_recipients for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy lead_briefs_recipient_read on public.lead_briefs for select to authenticated using(exists(select 1 from public.lead_recipients lr join public.businesses b on b.id=lr.business_id where lr.brief_id=lead_briefs.id and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy lead_briefs_mfa on public.lead_briefs as restrictive to authenticated using(public.is_mfa_compliant()) with check(public.is_mfa_compliant());
create policy lead_recipients_mfa on public.lead_recipients as restrictive to authenticated using(public.is_mfa_compliant());

create function public.dispatch_lead(p_brief_id uuid,p_business_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.businesses where id=p_business_id and tier in ('verified','highlight','spotlight')) then raise exception 'Business cannot receive new leads'; end if;
 insert into public.lead_recipients(brief_id,business_id) values(p_brief_id,p_business_id) on conflict do nothing;
end; $$;
revoke all on function public.dispatch_lead(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dispatch_lead(uuid,uuid) to service_role;

-- Attestations must be written only by a trusted link checker.
revoke insert,update,delete on public.verification_badges from anon,authenticated;
create function public.attest_business_badge(p_badge_id uuid,p_verified boolean,p_expected_website text) returns void language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
 select b.id into target from public.verification_badges badge join public.businesses b on b.id=badge.business_id
 where badge.id=p_badge_id and b.website=p_expected_website for update of b, badge;
 if target is null then raise exception 'Badge or website changed during verification'; end if;
 update public.verification_badges set is_verified=p_verified, last_checked=now(), verified_at=case when p_verified then now() else null end where id=p_badge_id;
 update public.businesses set verification_status=case when p_verified then 'verified'::public.verification_status else 'pending'::public.verification_status end, tier=case when p_verified and tier='claimed' then 'verified'::public.business_tier when not p_verified and tier='verified' then 'claimed'::public.business_tier else tier end where id=target;
end; $$;
revoke all on function public.attest_business_badge(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.attest_business_badge(uuid,boolean,text) to service_role;

-- Paid gallery writes are serialized on the business row, including concurrent requests.
create table public.business_gallery (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 image_url text not null check (length(image_url) between 1 and 2048 and image_url ~ '^https://'),
 caption text check (length(caption) <= 500),
 display_order integer not null default 0,
 created_at timestamptz not null default now()
);
create index idx_business_gallery_business on public.business_gallery(business_id,display_order,id);
alter table public.business_gallery enable row level security;
revoke all on public.business_gallery from anon,authenticated,service_role;
grant select on public.business_gallery to anon,authenticated;
grant insert,delete on public.business_gallery to authenticated;
grant update(image_url,caption,display_order) on public.business_gallery to authenticated;
grant select,insert,update,delete on public.business_gallery to service_role;
create policy business_gallery_public_read on public.business_gallery for select to anon,authenticated using(true);
create policy business_gallery_owner_insert on public.business_gallery for insert to authenticated with check(exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('highlight','spotlight') and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy business_gallery_owner_update on public.business_gallery for update to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('highlight','spotlight') and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions)))) with check(exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('highlight','spotlight') and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy business_gallery_owner_delete on public.business_gallery for delete to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy business_gallery_mfa on public.business_gallery as restrictive to authenticated using(public.is_mfa_compliant()) with check(public.is_mfa_compliant());
create function public.enforce_gallery_limit() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('anon','authenticated') then
  perform 1 from public.businesses where id=new.business_id for update;
  if (select count(*) from public.business_gallery where business_id=new.business_id) + coalesce((select sum(cardinality(images)) from public.business_cases where business_id=new.business_id),0) >= 20 then raise exception 'Gallery limit reached'; end if;
 end if;
 return new;
end; $$;
create trigger enforce_gallery_limit before insert on public.business_gallery for each row execute function public.enforce_gallery_limit();

drop policy business_analytics_owner_read on public.business_analytics_daily;
create policy business_analytics_owner_read on public.business_analytics_daily for select to authenticated using (
 exists(select 1 from public.businesses b where b.id=business_id and b.account_id=(select auth.uid()) and
 (b.tier in ('highlight','spotlight') or (b.tier='verified' and day >= current_date - 29))));

alter table public.lead_briefs
 add column request_id uuid not null default gen_random_uuid(),
 add column buyer_name text not null default '' check(length(buyer_name)<=200),
 add column buyer_email text not null default '' check(length(buyer_email)<=320),
 add column buyer_phone text check(length(buyer_phone)<=80),
 add column company_name text check(length(company_name)<=200),
 add column category_id uuid references public.categories(id) on delete set null,
 add column offering_kind text not null default 'service' check(offering_kind in ('service','software')),
 add column timeline text check(length(timeline)<=200),
 add column status text not null default 'open' check(status in ('open','closed')),
 add constraint lead_briefs_request_unique unique(buyer_user_id,request_id);
create index idx_lead_briefs_category on public.lead_briefs(category_id);
-- All creation goes through the atomic dispatch routine.
revoke insert on public.lead_briefs from authenticated;
create function public.create_lead_brief(p_payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); brief uuid; target uuid; targets uuid[]; request_key uuid;
begin
 if actor is null or not public.is_mfa_compliant() then raise exception 'Authentication required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,0));
 request_key := (p_payload->>'request_id')::uuid;
 if request_key is null then raise exception 'Request id required'; end if;
 select id into brief from public.lead_briefs where buyer_user_id=actor and request_id=request_key;
 if brief is not null then return brief; end if;
 if (select count(*) from public.lead_briefs where buyer_user_id=actor and created_at >= now()-interval '1 day') >= 5 then raise exception 'Daily brief limit reached'; end if;
 if not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null and lower(email)=lower(p_payload->>'buyer_email')) then raise exception 'Use your confirmed email'; end if;
 select coalesce(array_agg(value::uuid),array[]::uuid[]) into targets from jsonb_array_elements_text(coalesce(p_payload->'business_ids','[]'::jsonb));
 if cardinality(targets)>5 or cardinality(targets)<>(select count(distinct x) from unnest(targets) x) then raise exception 'Select at most five distinct businesses'; end if;
 if cardinality(targets)>0 and exists(select 1 from unnest(targets) x left join public.businesses b on b.id=x where b.id is null or b.tier not in ('verified','highlight','spotlight') or b.account_id=actor) then raise exception 'Ineligible recipient'; end if;
 if length(trim(coalesce(p_payload->>'buyer_name','')))<2 or coalesce(p_payload->>'buyer_email','') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'Valid buyer contact required'; end if;
 insert into public.lead_briefs(buyer_user_id,request_id,title,description,budget,buyer_name,buyer_email,buyer_phone,company_name,category_id,offering_kind,timeline)
 values(actor,request_key,p_payload->>'title',p_payload->>'description',nullif(p_payload->>'budget','')::numeric,p_payload->>'buyer_name',p_payload->>'buyer_email',nullif(p_payload->>'buyer_phone',''),nullif(p_payload->>'company_name',''),nullif(p_payload->>'category_id','')::uuid,coalesce(nullif(p_payload->>'offering_kind',''),'service'),nullif(p_payload->>'timeline',''))
 on conflict(buyer_user_id,request_id) do nothing returning id into brief;
 if brief is null then select id into brief from public.lead_briefs where buyer_user_id=actor and request_id=request_key; return brief; end if;
 if cardinality(targets)=0 then
   select coalesce(array_agg(id),array[]::uuid[]) into targets from (select b.id from public.businesses b where b.tier in ('verified','highlight','spotlight') and b.account_id is distinct from actor and b.offering_kind=coalesce(nullif(p_payload->>'offering_kind',''),'service') and (nullif(p_payload->>'category_id','') is null or exists(select 1 from public.business_categories bc where bc.business_id=b.id and bc.category_id=(p_payload->>'category_id')::uuid)) order by b.tier desc,b.id limit 4) candidates;
 end if;
 foreach target in array targets loop insert into public.lead_recipients(brief_id,business_id) values(brief,target); end loop;
 return brief;
end; $$;
revoke all on function public.create_lead_brief(jsonb) from public,anon;
grant execute on function public.create_lead_brief(jsonb) to authenticated;
create function public.close_lead_brief(p_brief_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_mfa_compliant() then raise exception 'Authentication required'; end if;
 update public.lead_briefs set status='closed' where id=p_brief_id and buyer_user_id=auth.uid();
 if not found then raise exception 'Brief not found'; end if;
end; $$;
revoke all on function public.close_lead_brief(uuid) from public,anon;
grant execute on function public.close_lead_brief(uuid) to authenticated;

alter table public.lead_recipients add column status text not null default 'new' check(status in ('new','contacted','declined'));
grant update(status) on public.lead_recipients to authenticated;
create policy lead_recipients_owner_update on public.lead_recipients for update to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions)))) with check(exists(select 1 from public.businesses b where b.id=business_id and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create table public.lead_messages (
 id uuid primary key default gen_random_uuid(),
 brief_id uuid not null,
 business_id uuid not null,
 sender_id uuid references auth.users(id) on delete set null default auth.uid(),
 content text not null check(length(trim(content)) between 1 and 5000),
 created_at timestamptz not null default now(),
 foreign key(brief_id,business_id) references public.lead_recipients(brief_id,business_id) on delete cascade
);
create index idx_lead_messages_thread on public.lead_messages(brief_id,business_id,created_at);
alter table public.lead_messages enable row level security;
revoke all on public.lead_messages from anon,authenticated,service_role;
grant select,insert on public.lead_messages to authenticated;
grant select,insert,update,delete on public.lead_messages to service_role;
create policy lead_messages_read on public.lead_messages for select to authenticated using (
 exists(select 1 from public.lead_briefs l where l.id=brief_id and l.buyer_user_id=(select auth.uid())) or
 exists(select 1 from public.lead_recipients lr join public.businesses b on b.id=lr.business_id where lr.brief_id=lead_messages.brief_id and lr.business_id=lead_messages.business_id and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy lead_messages_insert on public.lead_messages for insert to authenticated with check (sender_id=(select auth.uid()) and
 exists(select 1 from public.lead_briefs l where l.id=brief_id and l.status='open') and (
 exists(select 1 from public.lead_briefs l where l.id=brief_id and l.buyer_user_id=(select auth.uid())) or
 exists(select 1 from public.lead_recipients lr join public.businesses b on b.id=lr.business_id where lr.brief_id=lead_messages.brief_id and lr.business_id=lead_messages.business_id and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions)))));
create policy lead_messages_mfa on public.lead_messages as restrictive to authenticated using(public.is_mfa_compliant()) with check(public.is_mfa_compliant());

-- Services are part of the basic claimed profile.
drop policy business_services_insert_self on public.business_services;
drop policy business_services_update_self on public.business_services;
create policy business_services_insert_self on public.business_services for insert to authenticated with check (exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('claimed','verified','highlight','spotlight') and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy business_services_update_self on public.business_services for update to authenticated using (exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('claimed','verified','highlight','spotlight') and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions)))) with check (exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('claimed','verified','highlight','spotlight') and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
revoke update on public.business_services from authenticated;
grant update(title,description,price_range,delivery_time,is_featured,display_order) on public.business_services to authenticated;

create table public.marketplace_subscriptions (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 provider_subscription_id text not null unique,
 provider_customer_id text not null,
 plan text not null check(plan in ('highlight','spotlight')),
 status text not null,
 current_period_end timestamptz,
 event_created timestamptz not null
);
alter table public.marketplace_subscriptions enable row level security;
revoke all on public.marketplace_subscriptions from anon,authenticated,service_role;
grant select on public.marketplace_subscriptions to authenticated;
grant select,insert,update,delete on public.marketplace_subscriptions to service_role;
create policy marketplace_subscriptions_owner_read on public.marketplace_subscriptions for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy marketplace_subscriptions_mfa on public.marketplace_subscriptions as restrictive to authenticated using(public.is_mfa_compliant());
create function public.apply_marketplace_subscription(p_payload jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare target uuid := (p_payload->>'business_id')::uuid; event_time timestamptz := (p_payload->>'event_created')::timestamptz; changed uuid;
begin
 if target is null or event_time is null then raise exception 'Business and event timestamp required'; end if;
 perform 1 from public.businesses where id=target for update;
 if not found then raise exception 'Business not found'; end if;
 insert into public.marketplace_subscriptions(business_id,provider_subscription_id,provider_customer_id,plan,status,current_period_end,event_created)
 values(target,p_payload->>'provider_subscription_id',p_payload->>'provider_customer_id',p_payload->>'plan',p_payload->>'status',nullif(p_payload->>'current_period_end','')::timestamptz,event_time)
 on conflict(business_id) do update set provider_subscription_id=excluded.provider_subscription_id,provider_customer_id=excluded.provider_customer_id,plan=excluded.plan,status=excluded.status,current_period_end=excluded.current_period_end,event_created=excluded.event_created
 where public.marketplace_subscriptions.event_created < excluded.event_created returning business_id into changed;
 if changed is null then return false; end if;
 update public.businesses set tier=case when p_payload->>'status' in ('active','trialing') then (p_payload->>'plan')::public.business_tier when verification_status='verified' then 'verified'::public.business_tier else 'claimed'::public.business_tier end where id=target;
 return true;
end; $$;
revoke all on function public.apply_marketplace_subscription(jsonb) from public,anon,authenticated;
grant execute on function public.apply_marketplace_subscription(jsonb) to service_role;

create function public.enforce_business_features() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('anon','authenticated') then
  if tg_op='INSERT' then
   if new.cover_image_url is not null or new.video_url is not null or new.calendar_url is not null or new.custom_cta_label is not null or new.custom_cta_url is not null then raise exception 'Paid plan required'; end if;
  elsif new.verification_status='verified' and new.website is distinct from old.website then
   raise exception 'Verified website can only be changed by the platform';
  elsif new.tier not in ('highlight','spotlight') and (new.cover_image_url is distinct from old.cover_image_url or new.video_url is distinct from old.video_url or new.calendar_url is distinct from old.calendar_url or new.custom_cta_label is distinct from old.custom_cta_label or new.custom_cta_url is distinct from old.custom_cta_url) then
   raise exception 'Paid plan required';
  end if;
  if new.vendor_business_id is not null and not exists(select 1 from public.businesses v where v.id=new.vendor_business_id and v.account_id=new.account_id and new.account_id is not null and v.offering_kind='service' and new.offering_kind='software') then raise exception 'Vendor must belong to the same account'; end if;
 end if;
 return new;
end; $$;
create trigger enforce_business_features before insert or update on public.businesses for each row execute function public.enforce_business_features();
alter table public.businesses
 add column team_story text,
 add column team_photo_url text,
 add column social_links jsonb not null default '{}'::jsonb check(jsonb_typeof(social_links)='object'),
 add column clients text[] not null default '{}',
 add column sectors text[] not null default '{}';

alter table public.reviews add column dimensions jsonb not null default '{}'::jsonb check(jsonb_typeof(dimensions)='object');

-- The definer lookup avoids recursive brief/recipient RLS while checking caller identity.
create function public.owns_lead_brief(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.lead_briefs where id=p_id and buyer_user_id=auth.uid());
$$;
revoke all on function public.owns_lead_brief(uuid) from public,anon;
grant execute on function public.owns_lead_brief(uuid) to authenticated;
create policy lead_recipients_buyer_read on public.lead_recipients for select to authenticated using(public.owns_lead_brief(brief_id));

create function public.create_marketplace_offering(p_payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); new_id uuid; category uuid; categories uuid[]; vendor uuid := nullif(p_payload->>'vendor_business_id','')::uuid;
begin
 if actor is null or not public.is_mfa_compliant() then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.accounts where id=actor and is_personal_account) then raise exception 'Personal account required'; end if;
 if length(trim(coalesce(p_payload->>'name',''))) not between 2 and 200 or coalesce(p_payload->>'website','') !~ '^https?://' then raise exception 'Name and website required'; end if;
 if vendor is not null and not exists(select 1 from public.businesses where id=vendor and account_id=actor and offering_kind='service' and coalesce(nullif(p_payload->>'offering_kind',''),'service')='software') then raise exception 'Vendor must belong to your account'; end if;
 select coalesce(array_agg(value::uuid),array[]::uuid[]) into categories from jsonb_array_elements_text(coalesce(p_payload->'category_ids','[]'::jsonb));
 if cardinality(categories)>10 or exists(select 1 from unnest(categories) c left join public.categories x on x.id=c where x.id is null or not x.is_active) then raise exception 'Invalid categories'; end if;
 insert into public.businesses(account_id,name,slug,website,description,offering_kind,vendor_business_id,tier)
 values(actor,p_payload->>'name',p_payload->>'slug',p_payload->>'website',p_payload->>'description',coalesce(nullif(p_payload->>'offering_kind',''),'service'),vendor,'claimed') returning id into new_id;
 foreach category in array categories loop insert into public.business_categories(business_id,category_id) values(new_id,category) on conflict do nothing; end loop;
 return new_id;
end; $$;
revoke all on function public.create_marketplace_offering(jsonb) from public,anon;
grant execute on function public.create_marketplace_offering(jsonb) to authenticated;
create table public.review_reports (
 id uuid primary key default gen_random_uuid(),
 review_id uuid not null references public.reviews(id) on delete cascade,
 reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 reason text not null check(length(trim(reason)) between 3 and 2000),
 created_at timestamptz not null default now(),
 unique(review_id,reporter_id)
);
create index idx_review_reports_review on public.review_reports(review_id);
alter table public.review_reports enable row level security;
revoke all on public.review_reports from anon,authenticated,service_role;
grant insert on public.review_reports to authenticated;
grant select,insert,update,delete on public.review_reports to service_role;
create policy review_reports_submit on public.review_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and exists(select 1 from public.reviews r where r.id=review_id and r.status='approved'));
create policy review_reports_mfa on public.review_reports as restrictive to authenticated with check(public.is_mfa_compliant());

-- Integration credentials never enter the publicly readable business row.
create table public.business_integrations (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 webhook_url text not null check(webhook_url ~ '^https://' and length(webhook_url)<=2048),
 secret text check(length(secret)<=512),
 enabled boolean not null default true
);
alter table public.business_integrations enable row level security;
revoke all on public.business_integrations from anon,authenticated,service_role;
grant select,insert,delete on public.business_integrations to authenticated;
grant update(webhook_url,secret,enabled) on public.business_integrations to authenticated;
grant select,insert,update,delete on public.business_integrations to service_role;
create policy business_integrations_owner on public.business_integrations to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('highlight','spotlight') and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions)))) with check(exists(select 1 from public.businesses b where b.id=business_id and b.tier in ('highlight','spotlight') and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))));
create policy business_integrations_mfa on public.business_integrations as restrictive to authenticated using(public.is_mfa_compliant()) with check(public.is_mfa_compliant());

-- Public delivery, tightly scoped writes. Logo is basic; gallery requires paid tier.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('business-media','business-media',true,2097152,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy business_media_read on storage.objects for select to anon,authenticated using(bucket_id='business-media');
create policy business_media_insert on storage.objects for insert to authenticated with check (
 bucket_id='business-media' and exists(select 1 from public.businesses b where b.id::text=(storage.foldername(name))[1] and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions)) and (((storage.foldername(name))[2]='logo' and b.tier in ('claimed','verified','highlight','spotlight')) or ((storage.foldername(name))[2]='gallery' and b.tier in ('highlight','spotlight')))) and public.is_mfa_compliant());
create policy business_media_delete on storage.objects for delete to authenticated using (
 bucket_id='business-media' and exists(select 1 from public.businesses b where b.id::text=(storage.foldername(name))[1] and (public.is_account_owner(b.account_id) or public.has_permission((select auth.uid()),b.account_id,'settings.manage'::public.app_permissions))) and public.is_mfa_compliant());
