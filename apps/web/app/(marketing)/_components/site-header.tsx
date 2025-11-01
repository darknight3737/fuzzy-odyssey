import Link from 'next/link';

import { JWTUserData } from '@kit/supabase/types';
import { Header } from '@kit/ui/marketing';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@kit/ui/navigation-menu';

import { Search, UserRound } from 'lucide-react';

export function SiteHeader(props: { user?: JWTUserData | null }) {
  return (
    <Header
      logo={
        <Link href={'/'} className={'font-bold lowercase'}>
          <span className={'text-2xl'}>selletive</span>
        </Link>
      }
      navigation={
        <div className={'hidden md:flex'}>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Find providers</NavigationMenuTrigger>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Get clients</NavigationMenuTrigger>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      }
      actions={
        <div className={'flex items-center space-x-3'}>
          <div className={'relative hidden md:block'}>
            <Input placeholder={'What service?'} className={'pr-9 w-[260px]'} />
            <Search className={'text-muted-foreground absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2'} />
          </div>

          <Button asChild>
            <Link href={'/contact'}>Post a project</Link>
          </Button>

          <button aria-label={'Profile'} className={'rounded-full p-2 hover:bg-accent'}>
            <UserRound className={'h-5 w-5'} />
          </button>
        </div>
      }
    />
  );
}
