import { cookies, headers } from 'next/headers';

import { getMessages } from 'next-intl/server';
import { PublicEnvScript } from 'next-runtime-env';

import { Toaster } from '@kit/ui/sonner';
import { cn } from '@kit/ui/utils';

import { RootProviders } from '~/components/root-providers';
import { getFontsClassName } from '~/lib/fonts';
import { generateRootMetadata } from '~/lib/root-metadata';
import { getRootTheme } from '~/lib/root-theme';

import '../styles/globals.css';

export const generateMetadata = () => {
  return generateRootMetadata();
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, nonce, messages] = await Promise.all([
    getRootTheme(),
    getCspNonce(),
    getMessages(),
  ]);

  const className = getRootClassName(theme);
  const locale = (await cookies()).get('lang')?.value || 'en';

  return (
    <html lang={locale} className={className}>
      <head>
        <PublicEnvScript nonce={nonce} />
      </head>

      <body>
        <RootProviders
          theme={theme}
          locale={locale}
          nonce={nonce}
          messages={messages}
        >
          {children}
        </RootProviders>

        <Toaster richColors={true} theme={theme} position="top-center" />
      </body>
    </html>
  );
}

function getRootClassName(theme: string) {
  const fontsClassName = getFontsClassName(theme);

  return cn(
    'bg-background min-h-screen antialiased md:overscroll-y-none',
    fontsClassName,
  );
}

async function getCspNonce() {
  const headersStore = await headers();

  return headersStore.get('x-nonce') ?? undefined;
}
