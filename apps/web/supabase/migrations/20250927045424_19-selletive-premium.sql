create table "public"."business_awards" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "title" text not null,
    "issuer" text not null,
    "year" integer,
    "description" text,
    "certificate_url" text,
    "is_featured" boolean not null default false,
    "display_order" integer not null default 0,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."business_awards" enable row level security;

create table "public"."business_cases" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "title" text not null,
    "client_name" text,
    "industry" text,
    "project_type" text,
    "description" text not null,
    "challenge" text,
    "solution" text,
    "results" text,
    "duration" text,
    "budget_range" text,
    "images" text[] not null default '{}'::text[],
    "is_featured" boolean not null default false,
    "display_order" integer not null default 0,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."business_cases" enable row level security;

create table "public"."business_services" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "title" text not null,
    "description" text not null,
    "price_range" text,
    "delivery_time" text,
    "is_featured" boolean not null default false,
    "display_order" integer not null default 0,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."business_services" enable row level security;

CREATE UNIQUE INDEX business_awards_pkey ON public.business_awards USING btree (id);

CREATE UNIQUE INDEX business_cases_pkey ON public.business_cases USING btree (id);

CREATE UNIQUE INDEX business_services_pkey ON public.business_services USING btree (id);

CREATE INDEX idx_business_awards_business ON public.business_awards USING btree (business_id);

CREATE INDEX idx_business_awards_featured ON public.business_awards USING btree (is_featured);

CREATE INDEX idx_business_cases_business ON public.business_cases USING btree (business_id);

CREATE INDEX idx_business_cases_featured ON public.business_cases USING btree (is_featured);

CREATE INDEX idx_business_services_business ON public.business_services USING btree (business_id);

CREATE INDEX idx_business_services_featured ON public.business_services USING btree (is_featured);

alter table "public"."business_awards" add constraint "business_awards_pkey" PRIMARY KEY using index "business_awards_pkey";

alter table "public"."business_cases" add constraint "business_cases_pkey" PRIMARY KEY using index "business_cases_pkey";

alter table "public"."business_services" add constraint "business_services_pkey" PRIMARY KEY using index "business_services_pkey";

alter table "public"."business_awards" add constraint "business_awards_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_awards" validate constraint "business_awards_business_id_fkey";

alter table "public"."business_cases" add constraint "business_cases_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_cases" validate constraint "business_cases_business_id_fkey";

alter table "public"."business_services" add constraint "business_services_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_services" validate constraint "business_services_business_id_fkey";

grant delete on table "public"."business_awards" to "anon";

grant insert on table "public"."business_awards" to "anon";

grant references on table "public"."business_awards" to "anon";

grant select on table "public"."business_awards" to "anon";

grant trigger on table "public"."business_awards" to "anon";

grant truncate on table "public"."business_awards" to "anon";

grant update on table "public"."business_awards" to "anon";

grant delete on table "public"."business_awards" to "authenticated";

grant insert on table "public"."business_awards" to "authenticated";

grant references on table "public"."business_awards" to "authenticated";

grant select on table "public"."business_awards" to "authenticated";

grant trigger on table "public"."business_awards" to "authenticated";

grant truncate on table "public"."business_awards" to "authenticated";

grant update on table "public"."business_awards" to "authenticated";

grant delete on table "public"."business_awards" to "service_role";

grant insert on table "public"."business_awards" to "service_role";

grant references on table "public"."business_awards" to "service_role";

grant select on table "public"."business_awards" to "service_role";

grant trigger on table "public"."business_awards" to "service_role";

grant truncate on table "public"."business_awards" to "service_role";

grant update on table "public"."business_awards" to "service_role";

grant delete on table "public"."business_cases" to "anon";

grant insert on table "public"."business_cases" to "anon";

grant references on table "public"."business_cases" to "anon";

grant select on table "public"."business_cases" to "anon";

grant trigger on table "public"."business_cases" to "anon";

grant truncate on table "public"."business_cases" to "anon";

grant update on table "public"."business_cases" to "anon";

grant delete on table "public"."business_cases" to "authenticated";

grant insert on table "public"."business_cases" to "authenticated";

grant references on table "public"."business_cases" to "authenticated";

grant select on table "public"."business_cases" to "authenticated";

grant trigger on table "public"."business_cases" to "authenticated";

grant truncate on table "public"."business_cases" to "authenticated";

grant update on table "public"."business_cases" to "authenticated";

grant delete on table "public"."business_cases" to "service_role";

grant insert on table "public"."business_cases" to "service_role";

grant references on table "public"."business_cases" to "service_role";

grant select on table "public"."business_cases" to "service_role";

grant trigger on table "public"."business_cases" to "service_role";

grant truncate on table "public"."business_cases" to "service_role";

grant update on table "public"."business_cases" to "service_role";

grant delete on table "public"."business_services" to "anon";

grant insert on table "public"."business_services" to "anon";

grant references on table "public"."business_services" to "anon";

grant select on table "public"."business_services" to "anon";

grant trigger on table "public"."business_services" to "anon";

grant truncate on table "public"."business_services" to "anon";

grant update on table "public"."business_services" to "anon";

grant delete on table "public"."business_services" to "authenticated";

grant insert on table "public"."business_services" to "authenticated";

grant references on table "public"."business_services" to "authenticated";

grant select on table "public"."business_services" to "authenticated";

grant trigger on table "public"."business_services" to "authenticated";

grant truncate on table "public"."business_services" to "authenticated";

grant update on table "public"."business_services" to "authenticated";

grant delete on table "public"."business_services" to "service_role";

grant insert on table "public"."business_services" to "service_role";

grant references on table "public"."business_services" to "service_role";

grant select on table "public"."business_services" to "service_role";

grant trigger on table "public"."business_services" to "service_role";

grant truncate on table "public"."business_services" to "service_role";

grant update on table "public"."business_services" to "service_role";

create policy "business_awards_delete_self"
on "public"."business_awards"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_awards.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_awards_insert_self"
on "public"."business_awards"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_awards.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_awards_read_anon"
on "public"."business_awards"
as permissive
for select
to anon
using (true);


create policy "business_awards_read_auth"
on "public"."business_awards"
as permissive
for select
to authenticated
using (true);


create policy "business_awards_update_self"
on "public"."business_awards"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_awards.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))))
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_awards.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_cases_delete_self"
on "public"."business_cases"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_cases.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_cases_insert_self"
on "public"."business_cases"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_cases.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_cases_read_anon"
on "public"."business_cases"
as permissive
for select
to anon
using (true);


create policy "business_cases_read_auth"
on "public"."business_cases"
as permissive
for select
to authenticated
using (true);


create policy "business_cases_update_self"
on "public"."business_cases"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_cases.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))))
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_cases.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_services_delete_self"
on "public"."business_services"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_services.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_services_insert_self"
on "public"."business_services"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_services.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_services_read_anon"
on "public"."business_services"
as permissive
for select
to anon
using (true);


create policy "business_services_read_auth"
on "public"."business_services"
as permissive
for select
to authenticated
using (true);


create policy "business_services_update_self"
on "public"."business_services"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_services.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))))
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_services.business_id) AND (b.tier = ANY (ARRAY['highlight'::business_tier, 'spotlight'::business_tier])) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


CREATE TRIGGER trigger_set_timestamps_on_business_awards BEFORE INSERT OR UPDATE ON public.business_awards FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_business_awards BEFORE INSERT OR UPDATE ON public.business_awards FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_business_cases BEFORE INSERT OR UPDATE ON public.business_cases FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_business_cases BEFORE INSERT OR UPDATE ON public.business_cases FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_business_services BEFORE INSERT OR UPDATE ON public.business_services FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_business_services BEFORE INSERT OR UPDATE ON public.business_services FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();


