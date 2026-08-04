'use client';

import { createContext } from 'react';

import { Tables } from '@kit/supabase/database';
import { JWTUserData } from '@kit/supabase/types';

interface UserWorkspace {
  accounts: Array<{
    label: string | null;
    value: string | null;
    image: string | null;
  }>;

  workspace: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
    subscription_status: Tables<'subscriptions'>['status'] | null;
  };

  user: JWTUserData;
}

/**
 * Holds a promise rather than resolved data so the layout can render its shell
 * and children immediately. `useUserWorkspace` unwraps it with `use()`,
 * suspending only the components that actually read the workspace.
 */
export const UserWorkspaceContext =
  createContext<Promise<UserWorkspace> | null>(null);

export function UserWorkspaceContextProvider(
  props: React.PropsWithChildren<{
    value: Promise<UserWorkspace>;
  }>,
) {
  return (
    <UserWorkspaceContext.Provider value={props.value}>
      {props.children}
    </UserWorkspaceContext.Provider>
  );
}
