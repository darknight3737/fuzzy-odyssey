'use client';

import Link from 'next/link';

import { ArrowUpRight, Compass, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';

import { DirectoryShortlistMenu } from '~/components/directory-shortlist';

import { SiteMegamenu, siteMenus } from './site-megamenu';
import { SiteHeaderAccountSection } from './site-header-account-section';

import styles from '../marketing.module.css';

export function SiteHeader() {
  const t = useTranslations('marketing.home');
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="Selletive" className={styles.logo}>
          <Compass aria-hidden="true" /> selletive
        </Link>
        <nav aria-label={t('navExplore')} className={styles.desktopNav}>
          <SiteMegamenu />
        </nav>
        <div className={styles.actions}>
          <DirectoryShortlistMenu />
          <Link href="/projects/new" className={styles.companyLink}>
            Publicar projeto <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <SiteHeaderAccountSection />
          <div className={styles.mobileMenu}>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t('navMenu')}
                className={styles.mobileMenuTrigger}
              >
                <Menu size={24} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {siteMenus.map((item) => (
                  <DropdownMenuSub key={item.label}>
                    <DropdownMenuSubTrigger className="min-h-11">
                      {item.label}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                      side="bottom"
                      align="end"
                      className="w-64"
                    >
                      <DropdownMenuItem
                        className="min-h-11"
                        render={<Link href={item.href} />}
                      >
                        {item.label === 'Para empresas'
                          ? 'Cadastrar empresa ou software'
                          : `Ver todos · ${item.label}`}
                      </DropdownMenuItem>
                      {item.shortcuts?.map((link) => (
                        <DropdownMenuItem
                          key={link.href}
                          className="min-h-11"
                          render={<Link href={link.href} />}
                        >
                          {link.label}
                        </DropdownMenuItem>
                      ))}
                      {item.groups?.map((group) => (
                        <DropdownMenuItem
                          key={group.slug}
                          className="min-h-11"
                          render={
                            <Link
                              href={`/categories/${group.slug}`}
                              prefetch={false}
                            />
                          }
                        >
                          {group.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
                <DropdownMenuItem
                  className="min-h-11"
                  render={<Link href="/projects/new" />}
                >
                  Publicar projeto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
