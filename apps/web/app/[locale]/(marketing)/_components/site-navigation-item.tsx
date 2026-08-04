'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NavigationMenuItem } from '@kit/ui/navigation-menu';
import { cn, isRouteActive } from '@kit/ui/utils';

const getClassName = (isActive: boolean) =>
  cn(`inline-flex w-max text-sm font-medium transition-colors duration-300`, {
    'dark:text-gray-300 dark:hover:text-white': !isActive,
    'text-current dark:text-white': isActive,
  });

export function SiteNavigationItem({
  path,
  children,
}: React.PropsWithChildren<{
  path: string;
}>) {
  const currentPathName = usePathname();

  return (
    <SiteNavigationLink
      path={path}
      isActive={isRouteActive(path, currentPathName)}
    >
      {children}
    </SiteNavigationLink>
  );
}

/**
 * The link itself needs no URL data, so it renders in the shell. Only the
 * active highlight waits on `usePathname`.
 */
export function SiteNavigationLink({
  path,
  isActive = false,
  children,
}: React.PropsWithChildren<{
  path: string;
  isActive?: boolean;
}>) {
  return (
    <NavigationMenuItem key={path}>
      <Link className={getClassName(isActive)} href={path} as={path}>
        {children}
      </Link>
    </NavigationMenuItem>
  );
}
