'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { JWTUserData } from '@kit/supabase/types';
import { Header } from '@kit/ui/marketing';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@kit/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Trans } from '@kit/ui/trans';

import { Menu, Search } from 'lucide-react';
import { SiteHeaderAccountSection } from './site-header-account-section';

function MobileNavigationDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={'Open Menu'} className={'md:hidden'}>
        <Menu className={'h-8 w-8'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className={'w-full'}>
        <DropdownMenuItem asChild>
          <Link href={'/categories'} className={'flex w-full h-full items-center'}>
            <Trans i18nKey={'marketing:findProviders'} defaults={'Find providers'} />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={'/contact'} className={'flex w-full h-full items-center'}>
            <Trans i18nKey={'marketing:getClients'} defaults={'Get clients'} />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={'/docs'} className={'flex w-full h-full items-center'}>
            <Trans i18nKey={'marketing:resources'} defaults={'Resources'} />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopSearch() {
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={'relative hidden md:block'}>
      <Input
        placeholder={'What service?'}
        className={'pr-9 w-[260px]'}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <Search className={'text-muted-foreground absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2'} />
    </form>
  );
}

function MobileSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setIsOpen(false);
      setSearchValue('');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label={'Search'}
        className={'rounded-full p-2 hover:bg-accent md:hidden'}
      >
        <Search className={'h-5 w-5'} />
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={'relative md:hidden'}>
      <Input
        placeholder={'What service?'}
        className={'pr-9 w-[200px]'}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        autoFocus
        onBlur={() => {
          if (!searchValue.trim()) {
            setIsOpen(false);
          }
        }}
      />
      <Search className={'text-muted-foreground absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2'} />
    </form>
  );
}

export function SiteHeader(props: { user?: JWTUserData | null }) {
  return (
    <Header
      logo={
        <div className={'flex items-center gap-3'}>
          <div className={'flex md:hidden'}>
            <MobileNavigationDropdown />
          </div>
          <Link href={'/'} className={'font-bold lowercase'}>
            <span className={'text-2xl'}>selletive</span>
          </Link>
        </div>
      }
      navigation={
        <div className={'hidden md:flex'}>
          <NavigationMenu>
            <NavigationMenuList className={'gap-x-2.5'}>
              <NavigationMenuItem>
                <Link
                  href={'/categories'}
                  className={'inline-flex w-max text-sm font-medium transition-colors duration-300'}
                >
                  <Trans i18nKey={'marketing:findProviders'} defaults={'Find providers'} />
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href={'/contact'}
                  className={'inline-flex w-max text-sm font-medium transition-colors duration-300'}
                >
                  <Trans i18nKey={'marketing:getClients'} defaults={'Get clients'} />
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href={'/docs'}
                  className={'inline-flex w-max text-sm font-medium transition-colors duration-300'}
                >
                  <Trans i18nKey={'marketing:resources'} defaults={'Resources'} />
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      }
      actions={
        <div className={'flex items-center space-x-3'}>
          <DesktopSearch />

          <Button asChild className={'hidden md:inline-flex'}>
            <Link href={'/contact'}>Post a project</Link>
          </Button>

          <MobileSearch />
          <SiteHeaderAccountSection user={props.user ?? null} />
        </div>
      }
    />
  );
}
