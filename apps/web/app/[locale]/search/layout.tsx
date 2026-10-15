import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';

export default function DirectoryLayout({children}: React.PropsWithChildren) {
  return <div className="flex min-h-screen flex-col"><SiteHeader />{children}<SiteFooter /></div>;
}
