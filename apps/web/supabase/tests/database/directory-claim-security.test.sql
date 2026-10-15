-- Run with psql -v ON_ERROR_STOP=1 against a disposable migrated database.
-- Every test rolls back its fixtures; no project credentials are required.
begin;
select no_plan();
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
values ('10000000-0000-0000-0000-000000000001','owner@claim-qa.example',now(),'{}'),
       ('10000000-0000-0000-0000-000000000002','other@different.example',now(),'{}'),
       ('10000000-0000-0000-0000-000000000003','unconfirmed@claim-qa.example',null,'{}'),
       ('10000000-0000-0000-0000-000000000004','second@claim-qa.example',now(),'{}');
update auth.users set raw_user_meta_data='{"email":"owner@claim-qa.example"}' where id='10000000-0000-0000-0000-000000000002';
insert into public.businesses(id,name,slug,website,account_id,tier)
values ('20000000-0000-0000-0000-000000000001','Claim QA','claim-qa','https://www.claim-qa.example',null,'unclaimed');
set local role anon;
do $$begin
  if not exists(select 1 from public.businesses where slug='claim-qa') then raise exception 'Unclaimed profiles must be public'; end if;
  begin
    perform public.claim_business('claim-qa');
    raise exception 'Anonymous claim unexpectedly allowed';
  exception when insufficient_privilege then null; end;
end$$;
select pass('Unclaimed profiles are public, anonymous claims are denied');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}';
set local role authenticated;
do $$begin
  begin
    perform public.claim_business('claim-qa');
    raise exception 'Wrong domain unexpectedly allowed';
  exception when raise_exception then
    if sqlerrm <> 'Use a confirmed email matching the company website domain' then raise; end if;
  end;
end$$;
select pass('Wrong corporate domain is denied');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal1"}';
set local role authenticated;
do $$begin
  begin
    perform public.claim_business('claim-qa');
    raise exception 'Unconfirmed email unexpectedly allowed';
  exception when raise_exception then
    if sqlerrm <> 'Confirm your corporate email first' then raise; end if;
  end;
end$$;
select pass('Unconfirmed email is denied');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}';
set local role authenticated;
select public.claim_business('claim-qa');
do $$begin
  if not exists(select 1 from public.businesses where slug='claim-qa' and tier='claimed' and account_id=auth.uid()) then raise exception 'Claim did not transfer ownership'; end if;
  begin
    perform public.claim_business('claim-qa');
    raise exception 'Duplicate claim unexpectedly allowed';
  exception when raise_exception then
    if sqlerrm <> 'This profile has already been claimed' then raise; end if;
  end;
  begin
    update public.businesses set tier='verified' where slug='claim-qa';
    raise exception 'Self verification unexpectedly allowed';
  exception when raise_exception then
    if sqlerrm <> 'Trust fields are managed by the platform' then raise; end if;
  end;
  begin
    update public.businesses set account_id='10000000-0000-0000-0000-000000000002' where slug='claim-qa';
    raise exception 'Ownership reassignment unexpectedly allowed';
  exception when raise_exception then
    if sqlerrm <> 'Trust fields are managed by the platform' then raise; end if;
  end;
  update public.businesses set description='Owner edit succeeded' where slug='claim-qa';
  if not exists(select 1 from public.businesses where slug='claim-qa' and description='Owner edit succeeded') then raise exception 'Owner edit failed'; end if;
  begin
    insert into public.reviews(business_id,user_id,reviewer_name,reviewer_email,rating,status)
      values('20000000-0000-0000-0000-000000000001',auth.uid(),'Owner','owner@claim-qa.example',5,'pending');
    raise exception 'Self review unexpectedly allowed';
  exception when insufficient_privilege then null; end;
end$$;
select pass('Atomic claim transfers ownership; duplicates, trust changes and self reviews are denied');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}';
set local role authenticated;
insert into public.reviews(id,business_id,user_id,reviewer_name,reviewer_email,rating,title,content,status)
values ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',auth.uid(),'Reviewer','private@different.example',4,'Useful experience','An independent customer experience for testing.','pending');
do $$declare changed integer;begin
  update public.businesses set description='Unauthorized' where slug='claim-qa';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Cross-account edit unexpectedly allowed'; end if;
end$$;
select pass('Another account cannot edit the claimed company');
reset role;
set local role anon;
do $$begin
  if exists(select 1 from public.reviews where id='30000000-0000-0000-0000-000000000001') then raise exception 'Pending review exposed publicly'; end if;
  begin
    perform reviewer_email from public.reviews;
    raise exception 'Reviewer email exposed publicly';
  exception when insufficient_privilege then null; end;
end$$;
select pass('Pending reviews and private reviewer emails are hidden');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}';
set local role authenticated;
select throws_ok($$select reviewer_email from public.reviews$$, '42501', null, 'Authenticated visitors cannot select private reviewer email');
select throws_ok($$insert into public.businesses(name,slug,account_id,tier) values ('Foreign insert','foreign-insert-qa','10000000-0000-0000-0000-000000000001','claimed')$$, '42501', null, 'Another account cannot create a company owned by the victim');
delete from public.businesses where slug='claim-qa';
select ok(exists(select 1 from public.businesses where slug='claim-qa'), 'Another account cannot delete the claimed company');
update public.reviews set status='approved' where id='30000000-0000-0000-0000-000000000001';
reset role;
select is((select status::text from public.reviews where id='30000000-0000-0000-0000-000000000001'), 'pending', 'Ordinary reviewer cannot approve their review');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal1"}';
set local role authenticated;
select throws_ok($$select public.claim_business('claim-qa')$$, 'P0001', 'This profile has already been claimed', 'Another matching corporate email cannot take an owned profile');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}';
set local role authenticated;
select throws_ok($$update public.businesses set verification_status='verified' where slug='claim-qa'$$, 'P0001', 'Trust fields are managed by the platform', 'Owner cannot approve platform verification');
select throws_ok($$update public.businesses set domain_rating=99 where slug='claim-qa'$$, 'P0001', 'Trust fields are managed by the platform', 'Owner cannot change platform domain rating');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1","app_metadata":{"role":"super-admin"}}';
set local role authenticated;
update public.reviews set status='approved' where id='30000000-0000-0000-0000-000000000001';
reset role;
select is((select status::text from public.reviews where id='30000000-0000-0000-0000-000000000001'), 'pending', 'Super-admin cannot moderate without AAL2');
reset role;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2","app_metadata":{"role":"super-admin"}}';
set local role authenticated;
do $$begin
  update public.reviews set status='approved' where id='30000000-0000-0000-0000-000000000001';
  if not found then raise exception 'Admin moderation failed'; end if;
end$$;
select pass('AAL2 super-admin can moderate reviews');
reset role;
set local role anon;
do $$begin
  if not exists(select 1 from public.reviews where id='30000000-0000-0000-0000-000000000001') then raise exception 'Approved review missing publicly'; end if;
end$$;
select pass('Approved reviews are public');
reset role;
select * from finish();
rollback;
