import { Inter } from 'next/font/google';

import { Trans } from '@kit/ui/trans';

import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';

import styles from './marketing.module.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

/**
 * Fails the build if anything in the marketing subtree renders per request,
 * which would also break CDN caching. Remove it when enabling
 * `ENABLE_STRICT_CSP`: the root layout then reads `headers()` for the nonce,
 * and `ensureStatic` covers the layouts above this one too.
 */
export const ensureStatic = 'navigation';

/**
 * No server-side auth here: these pages are CDN-cacheable, so user data in the
 * HTML could be served to another visitor. The header resolves auth on the
 * client instead. Do not reintroduce a server-side user read in this subtree.
 */
function SiteLayout(props: React.PropsWithChildren) {
  return (
    <div className={`${styles.shell} ${inter.className}`}>
      <a href="#main-content" className={styles.skipLink}>
        <Trans i18nKey="marketing.home.skipLink" />
      </a>
      <SiteHeader />

      <div id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
        {props.children}
      </div>

      <SiteFooter />
    </div>
  );
}

export default SiteLayout;
