create type "public"."business_tier" as enum ('unclaimed', 'claimed', 'verified', 'highlight', 'spotlight');

create type "public"."location_type" as enum ('city', 'state', 'country');

create type "public"."response_status" as enum ('active', 'hidden');

create type "public"."review_status" as enum ('pending', 'approved', 'rejected');

create type "public"."verification_status" as enum ('pending', 'verified', 'rejected');

create table "public"."business_categories" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "category_id" uuid not null,
    "is_primary" boolean not null default false,
    "display_order" integer not null default 0,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."business_categories" enable row level security;

create table "public"."business_locations" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "location_id" uuid not null,
    "is_primary" boolean not null default false,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."business_locations" enable row level security;

create table "public"."businesses" (
    "id" uuid not null default gen_random_uuid(),
    "account_id" uuid not null,
    "name" text not null,
    "slug" text not null,
    "description" text,
    "website" text,
    "phone" text,
    "email" text,
    "address" jsonb,
    "logo_url" text,
    "cover_image_url" text,
    "employee_count" integer,
    "works_remotely" boolean not null default false,
    "founded_year" integer,
    "business_languages" text[] not null default '{}'::text[],
    "contact_enabled" boolean not null default false,
    "tier" business_tier not null default 'unclaimed'::business_tier,
    "verification_status" verification_status not null default 'pending'::verification_status,
    "domain_rating" integer not null default 0,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."businesses" enable row level security;

create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "parent_id" uuid,
    "level" integer not null,
    "icon" text,
    "is_active" boolean not null default true,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."categories" enable row level security;

create table "public"."category_aliases" (
    "id" uuid not null default gen_random_uuid(),
    "category_id" uuid not null,
    "alias_slug" text not null,
    "alias_name" text not null,
    "is_primary" boolean not null default false,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."category_aliases" enable row level security;

create table "public"."locations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "type" location_type not null,
    "parent_id" uuid,
    "country_code" text,
    "state_code" text,
    "coordinates" point,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."locations" enable row level security;

create table "public"."review_responses" (
    "id" uuid not null default gen_random_uuid(),
    "review_id" uuid not null,
    "user_id" uuid not null,
    "response_text" text not null,
    "status" response_status not null default 'active'::response_status,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."review_responses" enable row level security;

create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "user_id" uuid,
    "reviewer_name" text not null,
    "reviewer_email" text not null,
    "rating" integer not null,
    "title" text,
    "content" text,
    "status" review_status not null default 'pending'::review_status,
    "is_verified" boolean not null default false,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."reviews" enable row level security;

create table "public"."verification_badges" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid not null,
    "badge_code" text not null,
    "verification_url" text,
    "is_verified" boolean not null default false,
    "verified_at" timestamp with time zone,
    "last_checked" timestamp with time zone,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."verification_badges" enable row level security;

CREATE UNIQUE INDEX business_categories_business_id_category_id_key ON public.business_categories USING btree (business_id, category_id);

CREATE UNIQUE INDEX business_categories_pkey ON public.business_categories USING btree (id);

CREATE UNIQUE INDEX business_locations_business_id_location_id_key ON public.business_locations USING btree (business_id, location_id);

CREATE UNIQUE INDEX business_locations_pkey ON public.business_locations USING btree (id);

CREATE UNIQUE INDEX businesses_pkey ON public.businesses USING btree (id);

CREATE UNIQUE INDEX businesses_slug_key ON public.businesses USING btree (slug);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);

CREATE UNIQUE INDEX category_aliases_alias_slug_key ON public.category_aliases USING btree (alias_slug);

CREATE UNIQUE INDEX category_aliases_pkey ON public.category_aliases USING btree (id);

CREATE INDEX idx_business_categories_business ON public.business_categories USING btree (business_id);

CREATE INDEX idx_business_categories_category ON public.business_categories USING btree (category_id);

CREATE INDEX idx_business_locations_business ON public.business_locations USING btree (business_id);

CREATE INDEX idx_business_locations_location ON public.business_locations USING btree (location_id);

CREATE INDEX idx_businesses_account ON public.businesses USING btree (account_id);

CREATE INDEX idx_categories_level ON public.categories USING btree (level);

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);

CREATE INDEX idx_category_aliases_category ON public.category_aliases USING btree (category_id);

CREATE INDEX idx_locations_parent ON public.locations USING btree (parent_id);

CREATE INDEX idx_locations_type ON public.locations USING btree (type);

CREATE INDEX idx_review_responses_review ON public.review_responses USING btree (review_id);

CREATE INDEX idx_reviews_business ON public.reviews USING btree (business_id);

CREATE INDEX idx_reviews_status ON public.reviews USING btree (status);

CREATE INDEX idx_verification_badges_business ON public.verification_badges USING btree (business_id);

CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id);

CREATE UNIQUE INDEX locations_slug_key ON public.locations USING btree (slug);

CREATE UNIQUE INDEX review_responses_pkey ON public.review_responses USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX verification_badges_badge_code_key ON public.verification_badges USING btree (badge_code);

CREATE UNIQUE INDEX verification_badges_pkey ON public.verification_badges USING btree (id);

alter table "public"."business_categories" add constraint "business_categories_pkey" PRIMARY KEY using index "business_categories_pkey";

alter table "public"."business_locations" add constraint "business_locations_pkey" PRIMARY KEY using index "business_locations_pkey";

alter table "public"."businesses" add constraint "businesses_pkey" PRIMARY KEY using index "businesses_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."category_aliases" add constraint "category_aliases_pkey" PRIMARY KEY using index "category_aliases_pkey";

alter table "public"."locations" add constraint "locations_pkey" PRIMARY KEY using index "locations_pkey";

alter table "public"."review_responses" add constraint "review_responses_pkey" PRIMARY KEY using index "review_responses_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."verification_badges" add constraint "verification_badges_pkey" PRIMARY KEY using index "verification_badges_pkey";

alter table "public"."business_categories" add constraint "business_categories_business_id_category_id_key" UNIQUE using index "business_categories_business_id_category_id_key";

alter table "public"."business_categories" add constraint "business_categories_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_categories" validate constraint "business_categories_business_id_fkey";

alter table "public"."business_categories" add constraint "business_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE not valid;

alter table "public"."business_categories" validate constraint "business_categories_category_id_fkey";

alter table "public"."business_locations" add constraint "business_locations_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_locations" validate constraint "business_locations_business_id_fkey";

alter table "public"."business_locations" add constraint "business_locations_business_id_location_id_key" UNIQUE using index "business_locations_business_id_location_id_key";

alter table "public"."business_locations" add constraint "business_locations_location_id_fkey" FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE not valid;

alter table "public"."business_locations" validate constraint "business_locations_location_id_fkey";

alter table "public"."businesses" add constraint "businesses_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE not valid;

alter table "public"."businesses" validate constraint "businesses_account_id_fkey";

alter table "public"."businesses" add constraint "businesses_domain_rating_check" CHECK ((domain_rating >= 0)) not valid;

alter table "public"."businesses" validate constraint "businesses_domain_rating_check";

alter table "public"."businesses" add constraint "businesses_slug_key" UNIQUE using index "businesses_slug_key";

alter table "public"."categories" add constraint "categories_level_check" CHECK (((level >= 1) AND (level <= 3))) not valid;

alter table "public"."categories" validate constraint "categories_level_check";

alter table "public"."categories" add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL not valid;

alter table "public"."categories" validate constraint "categories_parent_id_fkey";

alter table "public"."categories" add constraint "categories_slug_key" UNIQUE using index "categories_slug_key";

alter table "public"."category_aliases" add constraint "category_aliases_alias_slug_key" UNIQUE using index "category_aliases_alias_slug_key";

alter table "public"."category_aliases" add constraint "category_aliases_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE not valid;

alter table "public"."category_aliases" validate constraint "category_aliases_category_id_fkey";

alter table "public"."locations" add constraint "locations_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE SET NULL not valid;

alter table "public"."locations" validate constraint "locations_parent_id_fkey";

alter table "public"."locations" add constraint "locations_slug_key" UNIQUE using index "locations_slug_key";

alter table "public"."review_responses" add constraint "review_responses_review_id_fkey" FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE not valid;

alter table "public"."review_responses" validate constraint "review_responses_review_id_fkey";

alter table "public"."review_responses" add constraint "review_responses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE not valid;

alter table "public"."review_responses" validate constraint "review_responses_user_id_fkey";

alter table "public"."reviews" add constraint "reviews_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_business_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE SET NULL not valid;

alter table "public"."reviews" validate constraint "reviews_user_id_fkey";

alter table "public"."verification_badges" add constraint "verification_badges_badge_code_key" UNIQUE using index "verification_badges_badge_code_key";

alter table "public"."verification_badges" add constraint "verification_badges_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE not valid;

alter table "public"."verification_badges" validate constraint "verification_badges_business_id_fkey";

grant delete on table "public"."business_categories" to "anon";

grant insert on table "public"."business_categories" to "anon";

grant references on table "public"."business_categories" to "anon";

grant select on table "public"."business_categories" to "anon";

grant trigger on table "public"."business_categories" to "anon";

grant truncate on table "public"."business_categories" to "anon";

grant update on table "public"."business_categories" to "anon";

grant delete on table "public"."business_categories" to "authenticated";

grant insert on table "public"."business_categories" to "authenticated";

grant references on table "public"."business_categories" to "authenticated";

grant select on table "public"."business_categories" to "authenticated";

grant trigger on table "public"."business_categories" to "authenticated";

grant truncate on table "public"."business_categories" to "authenticated";

grant update on table "public"."business_categories" to "authenticated";

grant delete on table "public"."business_categories" to "service_role";

grant insert on table "public"."business_categories" to "service_role";

grant references on table "public"."business_categories" to "service_role";

grant select on table "public"."business_categories" to "service_role";

grant trigger on table "public"."business_categories" to "service_role";

grant truncate on table "public"."business_categories" to "service_role";

grant update on table "public"."business_categories" to "service_role";

grant delete on table "public"."business_locations" to "anon";

grant insert on table "public"."business_locations" to "anon";

grant references on table "public"."business_locations" to "anon";

grant select on table "public"."business_locations" to "anon";

grant trigger on table "public"."business_locations" to "anon";

grant truncate on table "public"."business_locations" to "anon";

grant update on table "public"."business_locations" to "anon";

grant delete on table "public"."business_locations" to "authenticated";

grant insert on table "public"."business_locations" to "authenticated";

grant references on table "public"."business_locations" to "authenticated";

grant select on table "public"."business_locations" to "authenticated";

grant trigger on table "public"."business_locations" to "authenticated";

grant truncate on table "public"."business_locations" to "authenticated";

grant update on table "public"."business_locations" to "authenticated";

grant delete on table "public"."business_locations" to "service_role";

grant insert on table "public"."business_locations" to "service_role";

grant references on table "public"."business_locations" to "service_role";

grant select on table "public"."business_locations" to "service_role";

grant trigger on table "public"."business_locations" to "service_role";

grant truncate on table "public"."business_locations" to "service_role";

grant update on table "public"."business_locations" to "service_role";

grant delete on table "public"."businesses" to "anon";

grant insert on table "public"."businesses" to "anon";

grant references on table "public"."businesses" to "anon";

grant select on table "public"."businesses" to "anon";

grant trigger on table "public"."businesses" to "anon";

grant truncate on table "public"."businesses" to "anon";

grant update on table "public"."businesses" to "anon";

grant delete on table "public"."businesses" to "authenticated";

grant insert on table "public"."businesses" to "authenticated";

grant references on table "public"."businesses" to "authenticated";

grant select on table "public"."businesses" to "authenticated";

grant trigger on table "public"."businesses" to "authenticated";

grant truncate on table "public"."businesses" to "authenticated";

grant update on table "public"."businesses" to "authenticated";

grant delete on table "public"."businesses" to "service_role";

grant insert on table "public"."businesses" to "service_role";

grant references on table "public"."businesses" to "service_role";

grant select on table "public"."businesses" to "service_role";

grant trigger on table "public"."businesses" to "service_role";

grant truncate on table "public"."businesses" to "service_role";

grant update on table "public"."businesses" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."category_aliases" to "anon";

grant insert on table "public"."category_aliases" to "anon";

grant references on table "public"."category_aliases" to "anon";

grant select on table "public"."category_aliases" to "anon";

grant trigger on table "public"."category_aliases" to "anon";

grant truncate on table "public"."category_aliases" to "anon";

grant update on table "public"."category_aliases" to "anon";

grant delete on table "public"."category_aliases" to "authenticated";

grant insert on table "public"."category_aliases" to "authenticated";

grant references on table "public"."category_aliases" to "authenticated";

grant select on table "public"."category_aliases" to "authenticated";

grant trigger on table "public"."category_aliases" to "authenticated";

grant truncate on table "public"."category_aliases" to "authenticated";

grant update on table "public"."category_aliases" to "authenticated";

grant delete on table "public"."category_aliases" to "service_role";

grant insert on table "public"."category_aliases" to "service_role";

grant references on table "public"."category_aliases" to "service_role";

grant select on table "public"."category_aliases" to "service_role";

grant trigger on table "public"."category_aliases" to "service_role";

grant truncate on table "public"."category_aliases" to "service_role";

grant update on table "public"."category_aliases" to "service_role";

grant delete on table "public"."locations" to "anon";

grant insert on table "public"."locations" to "anon";

grant references on table "public"."locations" to "anon";

grant select on table "public"."locations" to "anon";

grant trigger on table "public"."locations" to "anon";

grant truncate on table "public"."locations" to "anon";

grant update on table "public"."locations" to "anon";

grant delete on table "public"."locations" to "authenticated";

grant insert on table "public"."locations" to "authenticated";

grant references on table "public"."locations" to "authenticated";

grant select on table "public"."locations" to "authenticated";

grant trigger on table "public"."locations" to "authenticated";

grant truncate on table "public"."locations" to "authenticated";

grant update on table "public"."locations" to "authenticated";

grant delete on table "public"."locations" to "service_role";

grant insert on table "public"."locations" to "service_role";

grant references on table "public"."locations" to "service_role";

grant select on table "public"."locations" to "service_role";

grant trigger on table "public"."locations" to "service_role";

grant truncate on table "public"."locations" to "service_role";

grant update on table "public"."locations" to "service_role";

grant delete on table "public"."review_responses" to "anon";

grant insert on table "public"."review_responses" to "anon";

grant references on table "public"."review_responses" to "anon";

grant select on table "public"."review_responses" to "anon";

grant trigger on table "public"."review_responses" to "anon";

grant truncate on table "public"."review_responses" to "anon";

grant update on table "public"."review_responses" to "anon";

grant delete on table "public"."review_responses" to "authenticated";

grant insert on table "public"."review_responses" to "authenticated";

grant references on table "public"."review_responses" to "authenticated";

grant select on table "public"."review_responses" to "authenticated";

grant trigger on table "public"."review_responses" to "authenticated";

grant truncate on table "public"."review_responses" to "authenticated";

grant update on table "public"."review_responses" to "authenticated";

grant delete on table "public"."review_responses" to "service_role";

grant insert on table "public"."review_responses" to "service_role";

grant references on table "public"."review_responses" to "service_role";

grant select on table "public"."review_responses" to "service_role";

grant trigger on table "public"."review_responses" to "service_role";

grant truncate on table "public"."review_responses" to "service_role";

grant update on table "public"."review_responses" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."verification_badges" to "anon";

grant insert on table "public"."verification_badges" to "anon";

grant references on table "public"."verification_badges" to "anon";

grant select on table "public"."verification_badges" to "anon";

grant trigger on table "public"."verification_badges" to "anon";

grant truncate on table "public"."verification_badges" to "anon";

grant update on table "public"."verification_badges" to "anon";

grant delete on table "public"."verification_badges" to "authenticated";

grant insert on table "public"."verification_badges" to "authenticated";

grant references on table "public"."verification_badges" to "authenticated";

grant select on table "public"."verification_badges" to "authenticated";

grant trigger on table "public"."verification_badges" to "authenticated";

grant truncate on table "public"."verification_badges" to "authenticated";

grant update on table "public"."verification_badges" to "authenticated";

grant delete on table "public"."verification_badges" to "service_role";

grant insert on table "public"."verification_badges" to "service_role";

grant references on table "public"."verification_badges" to "service_role";

grant select on table "public"."verification_badges" to "service_role";

grant trigger on table "public"."verification_badges" to "service_role";

grant truncate on table "public"."verification_badges" to "service_role";

grant update on table "public"."verification_badges" to "service_role";

create policy "business_categories_delete_self"
on "public"."business_categories"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_categories.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_categories_insert_self"
on "public"."business_categories"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_categories.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_categories_read_anon"
on "public"."business_categories"
as permissive
for select
to anon
using (true);


create policy "business_categories_read_auth"
on "public"."business_categories"
as permissive
for select
to authenticated
using (true);


create policy "business_categories_update_self"
on "public"."business_categories"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_categories.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))))
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_categories.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_locations_delete_self"
on "public"."business_locations"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_locations.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_locations_insert_self"
on "public"."business_locations"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_locations.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "business_locations_read_anon"
on "public"."business_locations"
as permissive
for select
to anon
using (true);


create policy "business_locations_read_auth"
on "public"."business_locations"
as permissive
for select
to authenticated
using (true);


create policy "business_locations_update_self"
on "public"."business_locations"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_locations.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))))
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_locations.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "businesses_delete_self"
on "public"."businesses"
as permissive
for delete
to authenticated
using ((has_permission(( SELECT auth.uid() AS uid), account_id, 'settings.manage'::app_permissions) OR is_account_owner(account_id) OR has_role_on_account(account_id, 'owner'::character varying)));


create policy "businesses_insert_self"
on "public"."businesses"
as permissive
for insert
to authenticated
with check ((has_permission(( SELECT auth.uid() AS uid), account_id, 'settings.manage'::app_permissions) OR is_account_owner(account_id) OR has_role_on_account(account_id, 'owner'::character varying)));


create policy "businesses_read_anon"
on "public"."businesses"
as permissive
for select
to anon
using (true);


create policy "businesses_read_auth"
on "public"."businesses"
as permissive
for select
to authenticated
using (true);


create policy "businesses_update_self"
on "public"."businesses"
as permissive
for update
to authenticated
using ((has_permission(( SELECT auth.uid() AS uid), account_id, 'settings.manage'::app_permissions) OR is_account_owner(account_id) OR has_role_on_account(account_id, 'owner'::character varying)))
with check ((has_permission(( SELECT auth.uid() AS uid), account_id, 'settings.manage'::app_permissions) OR is_account_owner(account_id) OR has_role_on_account(account_id, 'owner'::character varying)));


create policy "categories_read_anon"
on "public"."categories"
as permissive
for select
to anon
using (true);


create policy "categories_read_auth"
on "public"."categories"
as permissive
for select
to authenticated
using (true);


create policy "categories_write_admin"
on "public"."categories"
as permissive
for all
to authenticated
using (is_super_admin())
with check (is_super_admin());


create policy "category_aliases_read_anon"
on "public"."category_aliases"
as permissive
for select
to anon
using (true);


create policy "category_aliases_read_auth"
on "public"."category_aliases"
as permissive
for select
to authenticated
using (true);


create policy "category_aliases_write_admin"
on "public"."category_aliases"
as permissive
for all
to authenticated
using (is_super_admin())
with check (is_super_admin());


create policy "locations_read_anon"
on "public"."locations"
as permissive
for select
to anon
using (true);


create policy "locations_read_auth"
on "public"."locations"
as permissive
for select
to authenticated
using (true);


create policy "locations_write_admin"
on "public"."locations"
as permissive
for all
to authenticated
using (is_super_admin())
with check (is_super_admin());


create policy "review_responses_delete_self"
on "public"."review_responses"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (reviews r
     JOIN businesses b ON ((b.id = r.business_id)))
  WHERE ((r.id = review_responses.review_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "review_responses_insert_self"
on "public"."review_responses"
as permissive
for insert
to authenticated
with check (((EXISTS ( SELECT 1
   FROM (reviews r
     JOIN businesses b ON ((b.id = r.business_id)))
  WHERE ((r.id = review_responses.review_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))) AND (user_id = ( SELECT auth.uid() AS uid))));


create policy "review_responses_read_anon"
on "public"."review_responses"
as permissive
for select
to anon
using ((status = 'active'::response_status));


create policy "review_responses_read_auth"
on "public"."review_responses"
as permissive
for select
to authenticated
using (((status = 'active'::response_status) OR (EXISTS ( SELECT 1
   FROM (reviews r
     JOIN businesses b ON ((b.id = r.business_id)))
  WHERE ((r.id = review_responses.review_id) AND has_role_on_account(b.account_id))))));


create policy "review_responses_update_self"
on "public"."review_responses"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM (reviews r
     JOIN businesses b ON ((b.id = r.business_id)))
  WHERE ((r.id = review_responses.review_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))))
with check ((EXISTS ( SELECT 1
   FROM (reviews r
     JOIN businesses b ON ((b.id = r.business_id)))
  WHERE ((r.id = review_responses.review_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "reviews_delete_self"
on "public"."reviews"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = reviews.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "reviews_insert_anon"
on "public"."reviews"
as permissive
for insert
to anon
with check (((status = 'pending'::review_status) AND (user_id IS NULL)));


create policy "reviews_insert_auth"
on "public"."reviews"
as permissive
for insert
to authenticated
with check (((status = 'pending'::review_status) AND ((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid)))));


create policy "reviews_read_anon"
on "public"."reviews"
as permissive
for select
to anon
using ((status = 'approved'::review_status));


create policy "reviews_read_auth"
on "public"."reviews"
as permissive
for select
to authenticated
using (((status = 'approved'::review_status) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = reviews.business_id) AND has_role_on_account(b.account_id))))));


create policy "reviews_update_self"
on "public"."reviews"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = reviews.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))))
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = reviews.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "verification_badges_delete_self"
on "public"."verification_badges"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = verification_badges.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "verification_badges_insert_self"
on "public"."verification_badges"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = verification_badges.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


create policy "verification_badges_read_self"
on "public"."verification_badges"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = verification_badges.business_id) AND has_role_on_account(b.account_id)))));


create policy "verification_badges_update_self"
on "public"."verification_badges"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = verification_badges.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))))
with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = verification_badges.business_id) AND (has_permission(( SELECT auth.uid() AS uid), b.account_id, 'settings.manage'::app_permissions) OR is_account_owner(b.account_id) OR has_role_on_account(b.account_id, 'owner'::character varying))))));


CREATE TRIGGER trigger_set_timestamps_on_business_categories BEFORE INSERT OR UPDATE ON public.business_categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_business_categories BEFORE INSERT OR UPDATE ON public.business_categories FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_business_locations BEFORE INSERT OR UPDATE ON public.business_locations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_business_locations BEFORE INSERT OR UPDATE ON public.business_locations FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_businesses BEFORE INSERT OR UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_businesses BEFORE INSERT OR UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_categories BEFORE INSERT OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_categories BEFORE INSERT OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_category_aliases BEFORE INSERT OR UPDATE ON public.category_aliases FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_category_aliases BEFORE INSERT OR UPDATE ON public.category_aliases FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_locations BEFORE INSERT OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_locations BEFORE INSERT OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_review_responses BEFORE INSERT OR UPDATE ON public.review_responses FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_review_responses BEFORE INSERT OR UPDATE ON public.review_responses FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_reviews BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_reviews BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();

CREATE TRIGGER trigger_set_timestamps_on_verification_badges BEFORE INSERT OR UPDATE ON public.verification_badges FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamps();

CREATE TRIGGER trigger_set_user_tracking_on_verification_badges BEFORE INSERT OR UPDATE ON public.verification_badges FOR EACH ROW EXECUTE FUNCTION trigger_set_user_tracking();


