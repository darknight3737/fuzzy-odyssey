import 'server-only';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '~/lib/database.types';

/** Public directory reads always use the anonymous role, including for signed-in visitors. */
export function getDirectoryClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;
  if (!url || !key)
    throw new Error('Supabase public directory configuration is missing');
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
