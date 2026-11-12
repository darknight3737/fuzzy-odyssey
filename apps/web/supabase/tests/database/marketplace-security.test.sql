begin;
select no_plan();
select ok(not has_table_privilege('anon','public.lead_briefs','select'), 'anonymous cannot read lead briefs');
select ok(not has_table_privilege('authenticated','public.lead_recipients','insert'), 'buyers cannot forge recipients');
select ok(not has_function_privilege('authenticated','public.dispatch_lead(uuid,uuid)','execute'), 'dispatch is service-only');
select ok(not has_function_privilege('authenticated','public.attest_business_badge(uuid,boolean,text)','execute'), 'badge attestation is service-only');
select ok(not has_function_privilege('authenticated','public.apply_marketplace_subscription(jsonb)','execute'), 'billing updates are service-only');
select ok(not has_column_privilege('authenticated','public.business_cases','business_id','update'), 'case cannot be reparented');
select ok(not has_column_privilege('authenticated','public.business_gallery','business_id','update'), 'gallery image cannot be reparented');
select tests.create_supabase_user('market_buyer', 'market-buyer@example.com');
select tests.create_supabase_user('market_attacker', 'market-attacker@example.com');
set local role postgres;
insert into public.lead_briefs(buyer_user_id,title,description,buyer_name,buyer_email)
 values(tests.get_supabase_uid('market_buyer'),'Private project','A private project brief','Buyer','market-buyer@example.com');
select makerkit.authenticate_as('market_attacker');
select is_empty($$select id from public.lead_briefs where title='Private project'$$, 'another buyer cannot read the brief');
select throws_ok($$insert into public.lead_briefs(buyer_user_id,title,description) values (tests.get_supabase_uid('market_buyer'),'Forged brief','A forged project brief')$$, null, null, 'another buyer cannot insert a brief');
select throws_ok($$select public.apply_marketplace_subscription('{}'::jsonb)$$, null, null, 'buyer cannot update subscription');
reset role;
select tests.create_supabase_user('market_supplier', 'market-supplier@example.com');
insert into public.businesses(id,account_id,name,slug,tier)
values ('21000000-0000-0000-0000-000000000005', tests.get_supabase_uid('market_supplier'), 'Marketplace supplier', 'market-supplier-test', 'highlight');
insert into public.lead_recipients(brief_id,business_id)
select id,'21000000-0000-0000-0000-000000000005' from public.lead_briefs where title='Private project';
select makerkit.authenticate_as('market_supplier');
select is((select count(*)::int from public.lead_briefs where title='Private project'), 1, 'recipient owner can see delivered brief');
select lives_ok($$insert into public.lead_messages(brief_id,business_id,content)
select id,'21000000-0000-0000-0000-000000000005','Response from recipient'
from public.lead_briefs where title='Private project'$$, 'recipient owner can respond');
select lives_ok($$insert into public.business_gallery(business_id,image_url)
values ('21000000-0000-0000-0000-000000000005','https://example.com/paid-image.png')$$, 'paid owner can publish a gallery image');
select makerkit.authenticate_as('market_buyer');
select is((select count(*)::int from public.lead_recipients where business_id='21000000-0000-0000-0000-000000000005'), 1, 'buyer can see their own recipient');
select is((select count(*)::int from public.lead_messages where content='Response from recipient'), 1, 'buyer can read response');
select makerkit.authenticate_as('market_attacker');
select is_empty($$select id from public.lead_messages where content='Response from recipient'$$, 'unrelated account cannot see private messages');
reset role;
update public.businesses set tier='claimed' where slug='market-supplier-test';
set local role anon;
select is_empty($$select id from public.business_gallery where business_id='21000000-0000-0000-0000-000000000005'$$, 'downgrade hides gallery metadata');
select ok(has_column_privilege('anon','public.reviews','dimensions','select'), 'review dimensions are publicly readable');
select ok(not has_column_privilege('anon','public.reviews','reviewer_email','select'), 'reviewer email remains private');
reset role;
select * from finish();
rollback;
