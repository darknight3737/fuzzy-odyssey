import { Suspense } from 'react';

import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { SignUpMethodsContainer } from '@kit/auth/sign-up';
import { getSafeRedirectPath } from '@kit/shared/utils';
import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';

export const generateMetadata = async () => {
  const t = await getTranslations('auth');

  return {
    title: t('signUp'),
  };
};

async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; invite_token?: string }>;
}) {
  const { next, invite_token } = await searchParams;
  const returnPath = getSafeRedirectPath(
    next,
    invite_token
      ? `/join?invite_token=${encodeURIComponent(invite_token)}`
      : pathsConfig.app.home,
  );
  const paths = { callback: pathsConfig.auth.callback, appHome: returnPath };
  return (
    <>
      <div className={'flex flex-col items-center'}>
        <Heading level={2} className={'tracking-tighter'}>
          <Trans i18nKey={'auth.signUpHeading'} />
        </Heading>
      </div>

      <SignUpMethodsContainer
        providers={authConfig.providers}
        displayTermsCheckbox={authConfig.displayTermsCheckbox}
        paths={paths}
        captchaSiteKey={authConfig.captchaTokenSiteKey}
      />

      <div className={'flex justify-center'}>
        <Button
          render={
            <Link
              href={`${pathsConfig.auth.signIn}?next=${encodeURIComponent(returnPath)}`}
            >
              <Trans i18nKey={'auth.alreadyHaveAnAccount'} />
            </Link>
          }
          variant={'link'}
          size={'sm'}
          nativeButton={false}
        />
      </div>
    </>
  );
}

export default function Page(props: Parameters<typeof SignUpPage>[0]) {
  return (
    <Suspense fallback={<div role="status">Carregando…</div>}>
      <SignUpPage {...props} />
    </Suspense>
  );
}
