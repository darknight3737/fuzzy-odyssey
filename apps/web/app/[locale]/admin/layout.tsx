import { use } from 'react';

import { cookies } from 'next/headers';

import { Page, PageMobileNavigation, PageNavigation } from '@kit/ui/page';
import { SidebarProvider } from '@kit/ui/sidebar';

import { AdminSidebar } from '~/admin/_components/admin-sidebar';
import { AppLogo } from '~/components/app-logo';
import { MobileSidebarTrigger } from '~/components/mobile-sidebar-trigger';

export const metadata = {
  title: `Super Admin`,
  robots: { index: false, follow: false },
};

// AdminGuard must resolve super-admin status before anything renders.
export const instant = false;

export default function AdminLayout(props: React.PropsWithChildren) {
  const state = use(getLayoutState());

  return (
    <SidebarProvider defaultOpen={state.open}>
      <Page style={'sidebar'}>
        <PageNavigation>
          <AdminSidebar />
        </PageNavigation>

        <PageMobileNavigation>
          <div>
            <AppLogo />
          </div>

          <MobileSidebarTrigger />
        </PageMobileNavigation>

        {props.children}
      </Page>
    </SidebarProvider>
  );
}

async function getLayoutState() {
  const cookieStore = await cookies();
  const sidebarOpenCookie = cookieStore.get('sidebar_state');

  return {
    open: sidebarOpenCookie?.value === 'true',
  };
}
