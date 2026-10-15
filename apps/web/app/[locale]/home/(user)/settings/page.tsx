import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';

import { PersonalAccountSettingsContainer } from '@kit/accounts/personal-account-settings';

import { CardSkeleton, Delayed } from '~/components/skeletons/page-skeletons';
import authConfig from '~/config/auth.config';
import featureFlagsConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { AuthHashStatusListener } from './_components/auth-hash-status-listener';

// Show email option if password, magic link, or OTP is enabled
const showEmailOption =
  authConfig.providers.password ||
  authConfig.providers.magicLink ||
  authConfig.providers.otp;

const features = {
  showLinkEmailOption: showEmailOption,
  enablePasswordUpdate: authConfig.providers.password,
  enableAccountDeletion: featureFlagsConfig.enableAccountDeletion,
  enableAccountLinking: authConfig.enableIdentityLinking,
  enablePasskeys: authConfig.providers.passkey,
};

const providers = authConfig.providers.oAuth;

const callbackPath = pathsConfig.auth.callback;
const accountSettingsPath = pathsConfig.app.personalAccountSettings;

const paths = {
  callback: callbackPath + `?next=${accountSettingsPath}`,
};

export const generateMetadata = async () => {
  const t = await getTranslations('account');
  const title = t('settingsTab');

  return {
    title,
  };
};

function PersonalAccountSettingsPage() {
  return (
    <div className={'flex w-full flex-1 flex-col lg:max-w-2xl'}>
      <AuthHashStatusListener />

      <Suspense
        fallback={
          <Delayed>
            <CardSkeleton rows={4} />
          </Delayed>
        }
      >
        <PersonalAccountSettings />
      </Suspense>
    </div>
  );
}

async function PersonalAccountSettings() {
  const user = await requireUserInServerComponent();

  return (
    <PersonalAccountSettingsContainer
      userId={user.id}
      features={features}
      paths={paths}
      providers={providers}
    />
  );
}

export default PersonalAccountSettingsPage;
