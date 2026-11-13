'use client';

import { useId, useState } from 'react';

import Form from 'next/form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
import {
  recommendSearchScope,
  type SearchScope,
} from '~/lib/directory/search-intent';

import { SiteMegamenu, siteMenus } from './site-megamenu';
import { SiteHeaderAccountSection } from './site-header-account-section';

import styles from '../marketing.module.css';

const searchScopes = [
  { kind: '', label: 'Todos' },
  { kind: 'software', label: 'Software' },
  { kind: 'service', label: 'Serviços' },
] as const;

function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<SearchScope>();
  const term = query.trim();
  const visible = open && !!term;
  const recommended = recommendSearchScope(term);
  const active = choice ?? recommended;
  const options = [
    ...searchScopes.filter(({ kind }) => kind === recommended),
    ...searchScopes.filter(({ kind }) => kind !== recommended),
  ];
  const activeIndex = options.findIndex(({ kind }) => kind === active);

  return (
    <Form
      action="/search"
      role="search"
      aria-label="Busca do site"
      className={className}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onSubmit={() => setOpen(false)}
    >
      <input type="hidden" name="kind" value={term ? active : ''} />
      <input
        type="search"
        role="combobox"
        name="q"
        maxLength={120}
        aria-label="Empresa, serviço ou software"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={visible ? listId : undefined}
        aria-activedescendant={visible ? `${listId}-${activeIndex}` : undefined}
        placeholder="Busque um software, serviço ou empresa"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setChoice(undefined);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || !term) return;
          if (event.key === 'Escape' && visible) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const next = visible
              ? (activeIndex +
                  (event.key === 'ArrowDown' ? 1 : -1) +
                  options.length) %
                options.length
              : activeIndex;
            setChoice(options[next]?.kind);
            setOpen(true);
          }
        }}
      />
      <button type="submit" aria-label="Buscar">
        <Search size={18} aria-hidden="true" />
      </button>
      {visible && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Onde buscar"
          className={styles.searchOptions}
        >
          {options.map(({ kind, label }, index) => (
            <li
              key={label}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={kind === active}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                setOpen(false);
                router.push(
                  '/search?' + new URLSearchParams({ q: term, kind }),
                );
              }}
            >
              <span>
                Buscar “{term}” em <strong>{label}</strong>
              </span>
              {kind === active && <kbd aria-hidden="true">Enter</kbd>}
            </li>
          ))}
        </ul>
      )}
    </Form>
  );
}

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
          <HeaderSearch className={styles.headerSearch} />
          <details className={styles.collapsedSearch}>
            <summary aria-label="Abrir busca">
              <Search size={20} aria-hidden="true" />
            </summary>
            <HeaderSearch
              className={`${styles.headerSearch} ${styles.searchPopover}`}
            />
          </details>
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
