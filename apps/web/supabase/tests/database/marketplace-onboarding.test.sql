begin;
select plan(8);

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values
  ('71000000-0000-0000-0000-000000000001', 'owner@onboarding.example', now(), '{}'),
  ('71000000-0000-0000-0000-000000000002', 'other@different.example', now(), '{}'),
  ('71000000-0000-0000-0000-000000000003', 'pending@onboarding.example', null, '{}');

insert into public.categories(id, name, slug, level, is_active)
values ('72000000-0000-0000-0000-000000000001', 'Onboarding QA', 'onboarding-qa', 1, true);

insert into public.businesses(name, slug, website, tier)
values ('Imported QA', 'onboarding-qa-imported', 'http://www.onboarding.example/about', 'unclaimed');

set local onboarding.profile = '{
  "name": "Onboarding QA",
  "slug": "onboarding-qa-new",
  "website": "https://onboarding.example/product",
  "description": "A useful description for a B2B offering.",
  "offering_kind": "software",
  "category_ids": ["72000000-0000-0000-0000-000000000001"]
}';
select ok(not has_function_privilege('anon', 'public.create_marketplace_offering(jsonb)', 'execute'),
  'Only authenticated users can invoke listing creation');
select ok(not has_table_privilege('authenticated', 'public.businesses', 'insert'),
  'Profiles cannot be published outside the checked creation function');

set local request.jwt.claims = '{"sub":"71000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}';
set local role authenticated;
select throws_ok($$select public.create_marketplace_offering(current_setting('onboarding.profile')::jsonb)$$,
  'SL001', null, 'Publishing requires the email to match the site domain');
reset role;
set local request.jwt.claims = '{"sub":"71000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal1"}';
set local role authenticated;
select throws_ok($$select public.create_marketplace_offering(current_setting('onboarding.profile')::jsonb)$$,
  'SL001', null, 'Publishing requires a confirmed email');
reset role;
set local request.jwt.claims = '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}';
set local role authenticated;
select throws_ok($$select public.create_marketplace_offering(current_setting('onboarding.profile')::jsonb || '{"offering_kind":"service"}')$$,
  'SL002', null, 'The existing imported service profile takes precedence');
select lives_ok($$select public.create_marketplace_offering(current_setting('onboarding.profile')::jsonb)$$,
  'A confirmed owner can publish software on the same domain as a service profile');
select is((select count(*)::int from public.businesses b
    join public.business_categories bc on bc.business_id = b.id
    where b.slug = 'onboarding-qa-new' and b.account_id = auth.uid()
      and b.tier = 'claimed' and b.verification_status = 'pending'
      and bc.category_id = '72000000-0000-0000-0000-000000000001'),
  1, 'Published profile belongs to the caller, has a category and does not receive a verified badge');
select throws_ok($$select public.create_marketplace_offering(current_setting('onboarding.profile')::jsonb ||
    '{"name":"Renamed Product","slug":"another-product-qa","website":"https://www.onboarding.example/product/?source=qa#overview"}')$$,
  'SL002', null, 'Repeat publication of the same software page is rejected');
reset role;
select * from finish();
rollback;
