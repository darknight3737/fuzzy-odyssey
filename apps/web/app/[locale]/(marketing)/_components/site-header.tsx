'use client';
import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Menu, Search } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Input } from '@kit/ui/input';
import { Header } from '@kit/ui/marketing';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@kit/ui/navigation-menu';
import { Trans } from '@kit/ui/trans';

import { SiteHeaderAccountSection } from './site-header-account-section';
function MobileNavigationDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={'Open Menu'} className={'md:hidden'}>
        <Menu className={'h-8 w-8'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className={'w-full'}>
        <DropdownMenuItem
          render={
            <Link
              href={'/categories'}
              className={'flex h-full w-full items-center'}
            />
          }
        >
          <Trans
            i18nKey={'marketing.findProviders'}
            defaults={'Find providers'}
          />
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <Link
              href={'/claim'}
              className={'flex h-full w-full items-center'}
            />
          }
        >
          <Trans i18nKey={'marketing.getClients'} defaults={'Get clients'} />
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <Link href={'/faq'} className={'flex h-full w-full items-center'} />
          }
        >
          <Trans i18nKey={'marketing.resources'} defaults={'Resources'} />
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
        aria-label={'Buscar serviços'}
        placeholder={'Qual serviço?'}
        className={'w-[260px] pr-9'}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <Search
        className={
          'text-muted-foreground absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2'
        }
      />
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
        className={'hover:bg-accent rounded-full p-2 md:hidden'}
      >
        <Search className={'h-5 w-5'} />
      </button>
    );
  }
  return (
    <form onSubmit={handleSubmit} className={'relative md:hidden'}>
      <Input
        aria-label={'Buscar serviços'}
        placeholder={'Qual serviço?'}
        className={'w-[130px] pr-9 sm:w-[200px]'}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        autoFocus
        onBlur={() => {
          if (!searchValue.trim()) {
            setIsOpen(false);
          }
        }}
      />
      <Search
        className={
          'text-muted-foreground absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2'
        }
      />
    </form>
  );
}
export function SiteHeader() {
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
                  className={
                    'inline-flex w-max text-sm font-medium transition-colors duration-300'
                  }
                >
                  <Trans
                    i18nKey={'marketing.findProviders'}
                    defaults={'Find providers'}
                  />
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href={'/claim'}
                  className={
                    'inline-flex w-max text-sm font-medium transition-colors duration-300'
                  }
                >
                  <Trans
                    i18nKey={'marketing.getClients'}
                    defaults={'Get clients'}
                  />
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href={'/faq'}
                  className={
                    'inline-flex w-max text-sm font-medium transition-colors duration-300'
                  }
                >
                  <Trans
                    i18nKey={'marketing.resources'}
                    defaults={'Resources'}
                  />
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      }
      actions={
        <div className={'flex items-center space-x-3'}>
          <DesktopSearch />

          <Button
            className={'hidden md:inline-flex'}
            render={<Link href={'/claim'} />}
            nativeButton={false}
          >
            Minha empresa
          </Button>

          <MobileSearch />
          <SiteHeaderAccountSection />
        </div>
      }
    />
  );
}
