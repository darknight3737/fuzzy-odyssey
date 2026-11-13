'use client';

import { useCallback, useState } from 'react';

import type {
  Provider,
  SignInWithOAuthCredentials,
} from '@supabase/supabase-js';

import { useSignInWithProvider } from '@kit/supabase/hooks/use-sign-in-with-provider';
import { If } from '@kit/ui/if';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
import { Trans } from '@kit/ui/trans';

import { useLastAuthMethod } from '../hooks/use-last-auth-method';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthProviderButton } from './auth-provider-button';
import { GoogleIdTokenButton } from './google-id-token-button';
import { LastAuthMethodHint } from './last-auth-method-hint';

/**
 * @name OAUTH_SCOPES
 * @description
 * The OAuth scopes are used to specify the permissions that the application is requesting from the user.
 *
 * Please add your OAuth providers here and the scopes you want to use.
 *
 * @see https://supabase.com/docs/guides/auth/social-login
 */
const OAUTH_SCOPES: Partial<Record<Provider, string>> = {
  azure: 'email',
  keycloak: 'openid',
  // add your OAuth providers here
};

export const OauthProviders: React.FC<{
  shouldCreateUser: boolean;
  enabledProviders: Provider[];
  queryParams?: Record<string, string>;

  paths: {
    callback: string;
    returnPath: string;
  };
}> = (props) => {
  const signInWithProviderMutation = useSignInWithProvider();
  const { recordAuthMethod } = useLastAuthMethod();
  const [idTokenError, setIdTokenError] = useState<string | null>(null);

  // we make the UI "busy" until the next page is fully loaded
  const loading = signInWithProviderMutation.isPending;

  const onSignInWithProvider = useCallback(
    async (signInRequest: () => Promise<unknown>) => {
      const credential = await signInRequest();

      if (!credential) {
        return Promise.reject(new Error(`No credential returned`));
      }
    },
    [],
  );

  const enabledProviders = props.enabledProviders;

  if (!enabledProviders?.length) {
    return null;
  }

  return (
    <>
      <If condition={loading}>
        <LoadingOverlay />
      </If>

      <div className={'flex w-full flex-1 flex-col space-y-3'}>
        <div className={'flex-col space-y-2'}>
          {enabledProviders.map((provider) => {
            const redirectButton = (
              <AuthProviderButton
                key={provider}
                providerId={provider}
                onClick={() => {
                  const origin = window.location.origin;
                  const queryParams = new URLSearchParams();

                  if (props.paths.returnPath) {
                    queryParams.set('next', props.paths.returnPath);
                  }

                  const redirectPath = [
                    props.paths.callback,
                    queryParams.toString(),
                  ].join('?');

                  const redirectTo = [origin, redirectPath].join('');
                  const scopes = OAUTH_SCOPES[provider] ?? undefined;

                  const credentials = {
                    provider,
                    options: {
                      redirectTo,
                      queryParams: props.queryParams,
                      scopes,
                    },
                  } satisfies SignInWithOAuthCredentials;

                  return onSignInWithProvider(async () => {
                    // record before the mutation: signInWithOAuth navigates
                    // away with window.location.assign, so code after it may
                    // never run
                    recordAuthMethod('oauth', { provider });

                    return signInWithProviderMutation.mutateAsync(credentials);
                  });
                }}
              >
                <LastAuthMethodHint
                  name={provider}
                  type="oauth"
                  className="absolute right-0 translate-x-[50%] translate-y-[-50%]"
                />

                <Trans
                  i18nKey={'auth.signInWithProvider'}
                  values={{
                    provider: getProviderName(provider),
                  }}
                />
              </AuthProviderButton>
            );

            if (provider !== 'google') return redirectButton;

            return (
              <GoogleIdTokenButton
                key={provider}
                fallback={redirectButton}
                text={props.shouldCreateUser ? 'continue_with' : 'signin_with'}
                onSignedIn={() => {
                  recordAuthMethod('oauth', { provider });
                  const params = new URLSearchParams();
                  if (props.paths.returnPath) params.set('next', props.paths.returnPath);
                  window.location.assign(`${props.paths.callback}?${params}`);
                }}
                onError={(error) => setIdTokenError(error instanceof Error ? error.message : String(error))}
              />
            );
          })}
        </div>

        <AuthErrorAlert error={idTokenError ?? signInWithProviderMutation.error} />
      </div>
    </>
  );
};

function getProviderName(providerId: string) {
  const capitalize = (value: string) =>
    value.slice(0, 1).toUpperCase() + value.slice(1);

  if (providerId.endsWith('.com')) {
    return capitalize(providerId.split('.com')[0]!);
  }

  return capitalize(providerId);
}
