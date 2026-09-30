import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'http://127.0.0.1:54321';

/** Service-role client for the local stack. Bypasses RLS: test setup only. */
export function getSupabaseAdminClient() {
  return createClient(
    SUPABASE_URL,
    'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  );
}
