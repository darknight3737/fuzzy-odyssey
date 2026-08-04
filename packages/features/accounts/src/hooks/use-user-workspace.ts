'use client';

import { use, useContext } from 'react';

import { UserWorkspaceContext } from '../components';

/**
 * Suspends until the workspace resolves, so callers need a `<Suspense>`
 * boundary above them. Without one the nearest boundary further up handles it.
 */
export function useUserWorkspace() {
  const ctx = useContext(UserWorkspaceContext);

  if (!ctx) {
    throw new Error(
      'useUserWorkspace must be used within a UserWorkspaceProvider. This is only provided within the user workspace /home',
    );
  }

  return use(ctx);
}
