import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';

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
    <div className={'flex min-h-screen flex-col'}>
      <SiteHeader />

      {props.children}

      <SiteFooter />
    </div>
  );
}

export default SiteLayout;
