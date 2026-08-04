'use client';

import { createContext } from 'react';

import { Database } from '@kit/supabase/database';
import { JWTUserData } from '@kit/supabase/types';

interface AccountWorkspace {
  accounts: Database['public']['Views']['user_accounts']['Row'][];
  account: Database['public']['Functions']['team_account_workspace']['Returns'][0];
  user: JWTUserData;
}

/**
 * Holds a promise rather than resolved data so the layout can render its shell
 * and children immediately. `useTeamAccountWorkspace` unwraps it with `use()`,
 * suspending only the components that actually read the workspace.
 */
export const TeamAccountWorkspaceContext =
  createContext<Promise<AccountWorkspace> | null>(null);

export function TeamAccountWorkspaceContextProvider(
  props: React.PropsWithChildren<{ value: Promise<AccountWorkspace> }>,
) {
  return (
    <TeamAccountWorkspaceContext.Provider value={props.value}>
      {props.children}
    </TeamAccountWorkspaceContext.Provider>
  );
}
