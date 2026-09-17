import { Suspense } from 'react';

import { locale as localeRootParam } from 'next/root-params';

import { SidebarInset, SidebarProvider } from '@kit/ui/sidebar';
import { sidebarExtras } from '@kit/ui/sidebar-extras';

import { DocsHeader } from './_components/docs-header';
// local imports
import { DocsNavigation } from './_components/docs-navigation';
import { getDocs } from './_lib/server/docs.loader';
import { buildDocumentationTree } from './_lib/utils';

function DocsLayout({ children }: React.PropsWithChildren) {
  return (
    <SidebarProvider
      defaultOpen={true}
      // This layout does not go through `Page`, so it applies the guard itself.
      className={sidebarExtras.ssrDesktopGuard}
      style={
        {
          '--sidebar-width': '300px',
        } as React.CSSProperties
      }
    >
      <Suspense fallback={null}>
        <DocsSidebar />
      </Suspense>

      <SidebarInset className="h-screen overflow-y-auto overscroll-y-none">
        <DocsHeader />

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

async function DocsSidebar() {
  const pages = await getDocs(await localeRootParam());
  const tree = buildDocumentationTree(pages);

  return <DocsNavigation pages={tree} />;
}

export default DocsLayout;
