import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';

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
