import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.SUPABASE_TEST_URL ?? 'http://127.0.0.1:54321';

/** Service-role client for the local stack. Bypasses RLS: test setup only. */
export function getSupabaseAdminClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
      'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  );
}
