import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '~/lib/database.types';

/**
 * @name canAddMember
 * @description Check if the current user can add a member to the account
 *
 * This needs additional logic to determine if the user can add a member to the account
 * Please implement the logic and return a boolean value
 *
 * The same check needs to be added when creating an invitation
 *
 */
export async function canAddMember() {
  return Promise.resolve(true);
}

/**
 * Load account members
 * @param client
 * @param account
 */
export async function loadAccountMembers(
  client: SupabaseClient<Database>,
  account: string,
) {
  const { data, error } = await client.rpc('get_account_members', {
    account_slug: account,
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
}

/**
 * Load account invitations
 * @param client
 * @param account
 */
export async function loadAccountInvitations(
  client: SupabaseClient<Database>,
  account: string,
) {
  const { data, error } = await client.rpc('get_account_invitations', {
    account_slug: account,
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
}
