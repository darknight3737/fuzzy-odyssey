'use client';

import { use, useContext } from 'react';

import { TeamAccountWorkspaceContext } from '../components';

/**
 * @name useTeamAccountWorkspace
 * @description A hook to access the account workspace data.
 * @returns The account workspace data.
 *
 * Suspends until the workspace resolves, so callers need a `<Suspense>`
 * boundary above them. Without one the nearest boundary further up handles it.
 */
export function useTeamAccountWorkspace() {
  const ctx = useContext(TeamAccountWorkspaceContext);

  if (!ctx) {
    throw new Error(
      'useTeamAccountWorkspace must be used within a TeamAccountWorkspaceContext.Provider. This is only provided within the account workspace /home/[account]',
    );
  }

  return use(ctx);
}
