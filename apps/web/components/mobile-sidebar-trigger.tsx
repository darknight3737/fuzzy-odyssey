'use client';

import { Menu } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { useSidebar } from '@kit/ui/sidebar';

/**
 * Opens the app sidebar (as an off-canvas Sheet on mobile) from the mobile
 * top bar. Used in sidebar-style layouts so the top-bar menu button and the
 * sidebar share a single navigation surface instead of duplicating it.
 *
 * `collapsible` mirrors the value the layout gives its `Sidebar`. A
 * non-collapsible sidebar renders no Sheet and stays on screen at every
 * width, so there is nothing for this button to open — rendering it would
 * leave a dead control beside a sidebar that is already visible.
 */
export function MobileSidebarTrigger(props: {
  collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
  const { toggleSidebar } = useSidebar();

  if (props.collapsible === 'none') {
    return null;
  }

  return (
    <Button
      variant={'ghost'}
      size={'icon'}
      aria-label={'Open menu'}
      data-test={'mobile-sidebar-trigger'}
      onClick={toggleSidebar}
      className={'text-muted-foreground hover:text-foreground size-11'}
    >
      <Menu className={'size-6'} />
    </Button>
  );
}
