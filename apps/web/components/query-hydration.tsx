import { connection } from 'next/server';

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';

import { accountKeys } from '@kit/accounts/shared';
import { JWTUserData } from '@kit/supabase/types';

interface PersonalAccount {
  id: string | null;
  name: string | null;
  picture_url: string | null;
}

/**
 * Seeds the client cache with data the server already has.
 *
 * Without this, `useUser()` and `usePersonalAccountData()` are pending during
 * SSR, so every component gated on them server-renders a spinner and swaps on
 * the client — which shows up as empty cards and hydration mismatches once the
 * client cache is warm from a previous navigation.
 */
export async function QueryHydration({
  user,
  account,
  children,
}: React.PropsWithChildren<{
  user: JWTUserData;
  account?: PersonalAccount;
}>) {
  await connection();

  const queryClient = new QueryClient();

  queryClient.setQueryData(['supabase:user'], user);

  if (account?.id) {
    queryClient.setQueryData(accountKeys.data(user.id), account);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
