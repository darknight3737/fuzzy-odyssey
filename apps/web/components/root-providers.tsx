'use client';

import dynamic from 'next/dynamic';

import type { AbstractIntlMessages } from 'next-intl';
import { ThemeProvider } from 'next-themes';

import { I18nClientProvider } from '@kit/i18n/provider';
import { MonitoringProvider } from '@kit/monitoring/components';
import { AppEventsProvider } from '@kit/shared/events';
import { CSPProvider } from '@kit/ui/csp-provider';
import { If } from '@kit/ui/if';

import { AnalyticsProvider } from '~/components/analytics-provider';
import { AuthProvider } from '~/components/auth-provider';
import appConfig from '~/config/app.config';
import featuresFlagConfig from '~/config/feature-flags.config';

import { ReactQueryProvider } from './react-query-provider';

/**
 * A background poller with nothing to render on the server. It also calls
 * `Date.now()` via React Query during render, which can't be prerendered.
 */
const VersionUpdater = dynamic(
  () =>
    import('@kit/ui/version-updater').then((mod) => ({
      default: mod.VersionUpdater,
    })),
  { ssr: false },
);

type RootProvidersProps = React.PropsWithChildren<{
  // The language to use for the app (optional)
  locale?: string;
  // The theme (light or dark or system) (optional)
  theme?: string;
  // The CSP nonce to pass to scripts (optional)
  nonce?: string;
  messages: AbstractIntlMessages;
}>;

export function RootProviders({
  locale = 'en',
  messages,
  theme = appConfig.theme,
  nonce,
  children,
}: RootProvidersProps) {
  return (
    <MonitoringProvider>
      <AppEventsProvider>
        <AnalyticsProvider>
          <CSPProvider nonce={nonce}>
            <ReactQueryProvider>
              <I18nClientProvider locale={locale!} messages={messages}>
                <AuthProvider>
                  <ThemeProvider
                    attribute="class"
                    enableSystem
                    disableTransitionOnChange
                    defaultTheme={theme}
                    enableColorScheme={false}
                    nonce={nonce}
                  >
                    {children}
                  </ThemeProvider>
                </AuthProvider>

                <If condition={featuresFlagConfig.enableVersionUpdater}>
                  <VersionUpdater />
                </If>
              </I18nClientProvider>
            </ReactQueryProvider>
          </CSPProvider>
        </AnalyticsProvider>
      </AppEventsProvider>
    </MonitoringProvider>
  );
}
