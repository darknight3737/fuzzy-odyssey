'use client';

import { useContext } from 'react';

import { useRouter } from 'next/navigation';

import { AccountSelector } from '@kit/accounts/account-selector';
import { SidebarContext } from '@kit/ui/sidebar';

import featureFlagsConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const features = {
  enableTeamCreation: featureFlagsConfig.enableTeamCreation,
};

export function HomeAccountSelector(props: {
  accounts: Array<{
    label: string | null;
    value: string | null;
    image: string | null;
  }>;

  userId: string;
}) {
  const router = useRouter();
  const context = useContext(SidebarContext);

  return (
    <AccountSelector
      collapsed={!context?.open}
      accounts={props.accounts}
      features={features}
      userId={props.userId}
      onAccountChange={(value) => {
        if (value) {
          document.cookie = `last-selected-team=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

          const path = pathsConfig.app.accountHome.replace('[account]', value);
          router.replace(path);
        }
      }}
    />
  );
}
