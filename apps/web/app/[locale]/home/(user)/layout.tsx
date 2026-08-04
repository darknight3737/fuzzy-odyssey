import { Suspense, use } from 'react';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import * as z from 'zod';

import { UserWorkspaceContextProvider } from '@kit/accounts/components';
import { Page, PageMobileNavigation, PageNavigation } from '@kit/ui/page';
import { SidebarProvider } from '@kit/ui/sidebar';

import { AppLogo } from '~/components/app-logo';
import { MobileSidebarTrigger } from '~/components/mobile-sidebar-trigger';
import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';
import { personalAccountNavigationConfig } from '~/config/personal-account-navigation.config';

// home imports
import { HomeMenuNavigation } from './_components/home-menu-navigation';
import { HomeMobileNavigation } from './_components/home-mobile-navigation';
import { HomeSidebar } from './_components/home-sidebar';
import { loadUserWorkspace } from './_lib/server/load-user-workspace';

/**
 * The workspace promise is passed down unawaited so the page shell and
 * `children` render immediately. Only the navigation, which reads the
 * workspace, sits behind a boundary.
 */
function UserHomeLayout({ children }: React.PropsWithChildren) {
  const state = use(getLayoutState());
  const workspace = loadUserWorkspace();
  const isSidebar = state.style === 'sidebar';

  const navigation = isSidebar ? (
    // Renders its own frame and nav immediately; only its header suspends.
    <HomeSidebar />
  ) : (
    <Suspense fallback={null}>
      <UserHeaderNavigation />
    </Suspense>
  );

  const content = (
    <Page style={isSidebar ? 'sidebar' : 'header'}>
      <PageNavigation>{navigation}</PageNavigation>

      <PageMobileNavigation className={isSidebar ? 'md:hidden' : undefined}>
        <div>
          <AppLogo />
        </div>

        {/* The sidebar already holds the nav, so mobile only needs a trigger. */}
        {isSidebar ? (
          <MobileSidebarTrigger />
        ) : (
          <Suspense fallback={null}>
            <UserMobileNavigation />
          </Suspense>
        )}
      </PageMobileNavigation>

      {children}
    </Page>
  );

  return (
    <UserWorkspaceContextProvider value={workspace}>
      {isSidebar ? (
        <SidebarProvider defaultOpen={state.open}>{content}</SidebarProvider>
      ) : (
        content
      )}
    </UserWorkspaceContextProvider>
  );
}

export default UserHomeLayout;

async function UserHeaderNavigation() {
  const workspace = await loadWorkspaceOrRedirect();

  return <HomeMenuNavigation workspace={workspace} />;
}

async function UserMobileNavigation() {
  const workspace = await loadWorkspaceOrRedirect();

  return <HomeMobileNavigation workspace={workspace} />;
}

async function loadWorkspaceOrRedirect() {
  const workspace = await loadUserWorkspace().catch(() => null);

  if (!workspace) {
    redirect('/');
  }

  await redirectIfTeamsOnly(workspace);

  return workspace;
}

async function redirectIfTeamsOnly(
  workspace: Awaited<ReturnType<typeof loadUserWorkspace>>,
) {
  if (featuresFlagConfig.enableTeamsOnly) {
    const firstTeam = workspace.accounts[0];

    if (firstTeam?.value) {
      const cookieStore = await cookies();
      const lastSelected = cookieStore.get('last-selected-team')?.value;

      const preferred = lastSelected
        ? workspace.accounts.find((a) => a.value === lastSelected)
        : undefined;

      const team = preferred ?? firstTeam;

      redirect(pathsConfig.app.accountHome.replace('[account]', team.value!));
    } else {
      redirect(pathsConfig.app.createTeam);
    }
  }
}

async function getLayoutState() {
  const cookieStore = await cookies();

  const LayoutStyleSchema = z.enum(['sidebar', 'header', 'custom']);

  const layoutStyleCookie = cookieStore.get('layout-style');
  const sidebarOpenCookie = cookieStore.get('sidebar_state');

  const sidebarOpen = sidebarOpenCookie
    ? sidebarOpenCookie.value === 'true'
    : !personalAccountNavigationConfig.sidebarCollapsed;

  const parsedStyle = LayoutStyleSchema.safeParse(layoutStyleCookie?.value);

  const style = parsedStyle.success
    ? parsedStyle.data
    : personalAccountNavigationConfig.style;

  return {
    open: sidebarOpen,
    style,
  };
}
