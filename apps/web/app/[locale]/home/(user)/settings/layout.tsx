import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Trans } from '@kit/ui/trans';

// local imports
import { HomeLayoutPageHeader } from '../_components/home-page-header';

function UserSettingsLayout(props: React.PropsWithChildren) {
  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'account.routes.settings'} />}
        description={<AppBreadcrumbs />}
      />

      {props.children}
    </>
  );
}

export default UserSettingsLayout;
