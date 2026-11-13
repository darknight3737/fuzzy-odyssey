'use client';

import Form from 'next/form';
import Link from 'next/link';

import { ArrowUpRight, Menu, Search } from 'lucide-react';
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

import { AppLogo } from '~/components/app-logo';
import { DirectoryShortlistMenu } from '~/components/directory-shortlist';

import { SiteMegamenu, siteMenus } from './site-megamenu';
import { SiteHeaderAccountSection } from './site-header-account-section';

import styles from '../marketing.module.css';

export function SiteHeader() {
  const t = useTranslations('marketing.home');
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <AppLogo label="Selletive" color="green" className={styles.logo} />
        <nav aria-label={t('navExplore')} className={styles.desktopNav}>
          <SiteMegamenu />
        </nav>
        <div className={styles.actions}>
          <Form
            action="/search"
            role="search"
            aria-label="Busca do site"
            className={styles.headerSearch}
          >
            <input
              type="search"
              name="q"
              maxLength={120}
              aria-label="Empresa, serviço ou software"
              placeholder="Empresa, serviço ou software"
            />
            <button type="submit" aria-label="Buscar">
              <Search size={18} aria-hidden="true" />
            </button>
          </Form>
          <Link
            href="/search"
            aria-label="Buscar serviços e software"
            className={styles.collapsedSearch}
          >
            <Search size={20} aria-hidden="true" />
          </Link>
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
                <DropdownMenuItem
                  className="min-h-11"
                  render={<Link href="/search" />}
                >
                  Buscar serviços e software
                </DropdownMenuItem>
                {siteMenus.map((item) => (
                  <DropdownMenuSub key={item.label}>
                    <DropdownMenuSubTrigger
                      openOnHover={false}
                      className="min-h-11"
                    >
                      {item.label}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                      side="bottom"
                      align="end"
                      className="w-64"
                    >
                      {item.links.map((link) => (
                        <DropdownMenuItem
                          key={link.href}
                          className="min-h-11"
                          render={<Link href={link.href} />}
                        >
                          {link.label}
                        </DropdownMenuItem>
                      ))}
                      {item.groups?.map((group) => (
                        <DropdownMenuSub key={group.slug}>
                          <DropdownMenuSubTrigger
                            openOnHover={false}
                            className="min-h-11"
                          >
                            {group.label}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent
                            side="bottom"
                            align="end"
                            className="w-64"
                          >
                            <DropdownMenuItem
                              className="min-h-11"
                              render={
                                <Link
                                  href={`/categories/${group.slug}`}
                                  prefetch={false}
                                />
                              }
                            >
                              Ver todas as especialidades
                            </DropdownMenuItem>
                            {group.children.map((child) => (
                              <DropdownMenuItem
                                key={child.slug}
                                className="min-h-11"
                                render={
                                  <Link
                                    href={`/categories/${child.slug}`}
                                    prefetch={false}
                                  />
                                }
                              >
                                {child.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
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
