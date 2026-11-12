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

import { DirectoryShortlistMenu } from '~/components/directory-shortlist';

import { SiteHeaderAccountSection } from './site-header-account-section';

import styles from '../marketing.module.css';

export function SiteHeader() {
  const t = useTranslations('marketing.home');
  const links = [
    { href: '/search?kind=service', label: 'Serviços' },
    { href: '/search?kind=software', label: 'Software' },
    { href: '/categories', label: 'Categorias' },
    { href: '/pricing', label: 'Preços' },
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
          <DropdownMenu>
            <DropdownMenuTrigger className="min-h-11 text-sm font-medium">Para empresas</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/home/offerings/new" />}>Cadastrar empresa ou software</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/claim" />}>Reivindicar perfil</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                {[...links, { href: '/projects/new', label: 'Publicar projeto' }, { href: '/home/offerings/new', label: 'Cadastrar empresa ou software' }, { href: '/claim', label: 'Reivindicar perfil' }].map(
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
