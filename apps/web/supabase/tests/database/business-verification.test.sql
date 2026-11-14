begin;
select plan(17);

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data) values
  ('71000000-0000-0000-0000-000000000011', 'one@proof.example', now(), '{}'),
  ('71000000-0000-0000-0000-000000000012', 'two@proof.example', now(), '{}');

insert into public.businesses(id, name, slug, website, tier) values
  ('71000000-0000-0000-0000-000000000021', 'Proof QA', 'proof-qa', 'https://proof.example', 'unclaimed'),
  ('71000000-0000-0000-0000-000000000022', 'Email QA', 'email-qa', 'https://proof.example/email', 'unclaimed'),
  ('71000000-0000-0000-0000-000000000023', 'DNS QA', 'dns-qa', 'https://proof.example/dns', 'unclaimed');

insert into public.business_verification_requests(id, account_id, business_id, domain, support_status) values
  ('71000000-0000-0000-0000-000000000031', '71000000-0000-0000-0000-000000000011', '71000000-0000-0000-0000-000000000021', 'proof.example', 'pending'),
  ('71000000-0000-0000-0000-000000000032', '71000000-0000-0000-0000-000000000012', '71000000-0000-0000-0000-000000000021', 'proof.example', null),
  ('71000000-0000-0000-0000-000000000033', '71000000-0000-0000-0000-000000000011', '71000000-0000-0000-0000-000000000021', 'proof.example', null),
  ('71000000-0000-0000-0000-000000000034', '71000000-0000-0000-0000-000000000011', '71000000-0000-0000-0000-000000000022', 'proof.example', null),
  ('71000000-0000-0000-0000-000000000035', '71000000-0000-0000-0000-000000000011', '71000000-0000-0000-0000-000000000023', 'proof.example', null);

select ok(not has_table_privilege('authenticated', 'public.business_verification_requests', 'select'), 'Proofs are private');
select ok(not has_function_privilege('authenticated', 'public.complete_business_verification(uuid,uuid,text,text,text)', 'execute'), 'Users cannot attest their own proof');
select ok(not has_function_privilege('anon', 'public.complete_business_verification(uuid,uuid,text,text,text)', 'execute'), 'Anonymous callers cannot attest any proof');

set local role service_role;
select is(public.complete_business_verification('71000000-0000-0000-0000-000000000031', '71000000-0000-0000-0000-000000000012', 'support'), null, 'A request is bound to its account');
select is(public.complete_business_verification('71000000-0000-0000-0000-000000000031', '71000000-0000-0000-0000-000000000011', 'email', 'not-a-code'), null, 'Unissued code is rejected');
select is(public.complete_business_verification('71000000-0000-0000-0000-000000000031', '71000000-0000-0000-0000-000000000011', 'support'), 'proof-qa', 'Support can confirm a pending request');
select is((select tier::text from public.businesses where slug = 'proof-qa'), 'claimed', 'Support grants only claimed');
select is((select verification_status::text from public.businesses where slug = 'proof-qa'), 'pending', 'Support does not verify a badge');
select is(public.complete_business_verification('71000000-0000-0000-0000-000000000032', '71000000-0000-0000-0000-000000000012', 'badge'), null, 'A completed claim cannot be transferred by another proof');
select is(public.complete_business_verification('71000000-0000-0000-0000-000000000033', '71000000-0000-0000-0000-000000000011', 'badge', null, 'https://proof.example/'), 'proof-qa', 'Badge upgrades the owner');
select is((select tier::text from public.businesses where slug = 'proof-qa'), 'verified', 'Badge grants verified');
select ok(not public.reserve_business_verification_email('71000000-0000-0000-0000-000000000034', '71000000-0000-0000-0000-000000000011', 'user@other.example', 'test-digest'), 'A code cannot be sent to another domain');
select ok(public.reserve_business_verification_email('71000000-0000-0000-0000-000000000034', '71000000-0000-0000-0000-000000000011', 'user@proof.example', 'test-digest'), 'A corporate recipient can receive a code');
select is(public.complete_business_verification('71000000-0000-0000-0000-000000000034', '71000000-0000-0000-0000-000000000011', 'email', 'wrong'), null, 'A wrong code cannot grant control');
select is(public.complete_business_verification('71000000-0000-0000-0000-000000000034', '71000000-0000-0000-0000-000000000011', 'email', 'test-digest'), 'email-qa', 'A valid email code can grant control');
select is(public.complete_business_verification('71000000-0000-0000-0000-000000000035', '71000000-0000-0000-0000-000000000011', 'dns'), 'dns-qa', 'A DNS attestation can grant control');
select is((select count(*) from public.businesses where slug in ('email-qa','dns-qa') and tier = 'claimed' and verification_status = 'pending'), 2::bigint, 'Email and DNS grant only claimed');
reset role;
select * from finish();
rollback;
