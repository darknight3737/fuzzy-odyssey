import { Trans } from '@kit/ui/trans';

import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';
import styles from '~/(marketing)/marketing.module.css';

export default function DirectoryLayout({ children }: React.PropsWithChildren) {
  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        <Trans i18nKey="marketing.home.skipLink" />
      </a>
      <SiteHeader />
      <div id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
