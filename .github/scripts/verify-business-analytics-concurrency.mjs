import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// CI-only disposable database. No configurable hosted destination or credentials.
const execute = promisify(execFile);
const sql = (query) => execute('psql', [
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  '-v', 'ON_ERROR_STOP=1', '-c', query,
]);
const id = '21000000-0000-4000-8000-000000000099';
await sql(`insert into public.businesses(id,name,slug,account_id,tier) values ('${id}','Concurrent analytics CI','analytics-concurrency-ci',null,'unclaimed')`);
try {
  await Promise.all(Array.from({ length: 16 }, () => sql(
    `set role service_role; select public.record_business_interest('${id}','view',repeat('f',64))`,
  )));
  await sql(`do $$begin
    if (select count from public.business_analytics_daily where business_id='${id}' and event='view') is distinct from 1 then
      raise exception 'Parallel retries inflated analytics';
    end if;
  end$$;`);
  console.log('16 parallel submissions counted exactly once');
} finally {
  await sql(`delete from public.businesses where id='${id}'`);
}
