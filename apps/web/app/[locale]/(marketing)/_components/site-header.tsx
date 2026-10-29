'use client';

import Link from 'next/link';

import { ArrowUpRight, Compass, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';

import { SiteHeaderAccountSection } from './site-header-account-section';

import styles from '../marketing.module.css';

export function SiteHeader() {
  const t = useTranslations('marketing.home');
  const links = [
    { href: '/categories', label: t('navExplore') },
    { href: '/#como-funciona', label: t('navHow') },
    { href: '/faq', label: t('navResources') },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="Selletive" className={styles.logo}>
          <Compass aria-hidden="true" /> selletive
        </Link>
        <nav aria-label={t('navExplore')} className={styles.desktopNav}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <Link href="/claim" className={styles.companyLink}>
            {t('navBusiness')} <ArrowUpRight size={16} aria-hidden="true" />
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
                {[...links, { href: '/claim', label: t('navBusiness') }].map(
                  (link) => (
                    <DropdownMenuItem
                      key={link.href}
                      className="min-h-11"
                      render={<Link href={link.href} />}
                    >
                      {link.label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
