'use client';

import { Menu } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { useSidebar } from '@kit/ui/sidebar';

/**
 * Opens the app sidebar (as an off-canvas Sheet on mobile) from the mobile
 * top bar. Used in sidebar-style layouts so the top-bar menu button and the
 * sidebar share a single navigation surface instead of duplicating it.
 */
export function MobileSidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant={'ghost'}
      size={'icon'}
      aria-label={'Open menu'}
      onClick={toggleSidebar}
      className={'text-muted-foreground hover:text-foreground size-11'}
    >
      <Menu className={'size-6'} />
    </Button>
  );
}
