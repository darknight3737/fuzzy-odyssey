import { createBrowserClient } from '@supabase/ssr';

import { Database } from '../database.types';
import { getSupabaseClientKeys } from '../get-supabase-client-keys';

/**
 * @name getSupabaseBrowserClient
 * @description Get a Supabase client for use in the Browser
 */
export function getSupabaseBrowserClient<GenericSchema = Database>() {
  const keys = getSupabaseClientKeys();

  return createBrowserClient<GenericSchema>(keys.url, keys.publicKey, {
    cookieOptions: {
      // Mark session cookies as Secure in production (HTTPS). Gated to
      // production so local dev over http://localhost keeps working. Kept in
      // sync with the server/middleware clients to avoid attribute drift.
      secure: process.env.NODE_ENV === 'production',
    },
  });
}
