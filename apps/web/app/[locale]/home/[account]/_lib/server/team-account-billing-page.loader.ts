import 'server-only';
import { cache } from 'react';

import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createTeamAccountsApi } from '@kit/team-accounts/api';

/**
 * @name loadTeamAccountBillingPage
 * @description Load the team account billing page data for the given account.
 */
export const loadTeamAccountBillingPage = cache(teamAccountBillingPageLoader);

async function teamAccountBillingPageLoader(accountId: string) {
  await connection();

  const client = getSupabaseServerClient();
  const api = createTeamAccountsApi(client);

  const subscription = api.getSubscription(accountId);
  const order = api.getOrder(accountId);
  const customerId = api.getCustomerId(accountId);

  return Promise.all([subscription, order, customerId]);
}
