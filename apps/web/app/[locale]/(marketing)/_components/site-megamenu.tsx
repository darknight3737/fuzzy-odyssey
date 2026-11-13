'use client';

import { Fragment, useId, useState } from 'react';

import Link from 'next/link';

import { ChevronDown } from 'lucide-react';

import {
  serviceGroups,
  softwareMenuGroups,
  type TaxonomyGroup,
} from '~/lib/directory/taxonomy';

type MenuLink = { href: string; label: string };
type Menu = MenuLink & { groups?: TaxonomyGroup[]; shortcuts?: MenuLink[] };

export const siteMenus: Menu[] = [
  { href: '/search?kind=service', label: 'Serviços', groups: serviceGroups },
  {
    href: '/search?kind=software',
    label: 'Software',
    groups: softwareMenuGroups,
  },
  {
    href: '/categories',
    label: 'Categorias',
    shortcuts: [
      { href: '/categories#service', label: 'Categorias de Serviços' },
      { href: '/categories#software', label: 'Categorias de Software' },
    ],
  },
  {
    href: '/pricing',
    label: 'Preços',
    shortcuts: [
      { href: '/pricing#verified', label: 'Verificado' },
      { href: '/pricing#highlight', label: 'Destaque' },
      { href: '/pricing#spotlight', label: 'Spotlight' },
    ],
  },
  {
    href: '/home/offerings/new',
    label: 'Para empresas',
    shortcuts: [
      { href: '/claim', label: 'Reivindicar perfil' },
      { href: '/pricing', label: 'Ver planos para empresas' },
    ],
  },
];

export function SiteMegamenu() {
  const panelId = useId();
  const [selection, setSelection] = useState<{ menu: number; group: number }>();
  const menu = selection ? siteMenus[selection.menu] : undefined;
  const group = menu?.groups?.[selection?.group ?? 0];

  return (
    <div
      className="flex items-center gap-4"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setSelection(undefined);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !selection) return;
        event.currentTarget
          .querySelector<HTMLButtonElement>('[aria-expanded="true"]')
          ?.focus();
        setSelection(undefined);
      }}
    >
      {siteMenus.map((item, index) => (
        <Fragment key={item.href}>
          <button
            type="button"
            aria-expanded={selection?.menu === index}
            aria-controls={selection?.menu === index ? panelId : undefined}
            className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-sm font-medium hover:text-primary"
            onClick={() =>
              setSelection(
                selection?.menu === index
                  ? undefined
                  : { menu: index, group: 0 },
              )
            }
          >
            {item.label}
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
          {menu && selection?.menu === index && (
            <div
              id={panelId}
              className="absolute inset-x-0 top-full max-h-[75dvh] overflow-y-auto border-b bg-background shadow-lg"
            >
              <div className="mx-auto grid max-w-6xl grid-cols-[1fr_1fr_2fr] gap-6 px-6 py-5">
                <div>
                  <Link
                    href={menu.href}
                    onClick={() => setSelection(undefined)}
                  >
                    {menu.label === 'Para empresas'
                      ? 'Cadastrar empresa ou software'
                      : `Ver todos · ${menu.label}`}
                  </Link>
                  {menu.label === 'Software' && (
                    <ul>
                      {[
                        ['crm-software', 'CRM'],
                        ['erp-software', 'ERP'],
                        [
                          'marketing-automation-software',
                          'Automação de marketing',
                        ],
                      ].map(([slug, label]) => (
                        <li key={slug}>
                          <Link
                            href={`/categories/${slug}`}
                            onClick={() => setSelection(undefined)}
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {menu.groups && (
                  <div className="grid content-start gap-1">
                    {menu.groups.map((item, index) => (
                      <button
                        type="button"
                        key={item.slug}
                        aria-pressed={group?.slug === item.slug}
                        onClick={() =>
                          selection &&
                          setSelection({ ...selection, group: index })
                        }
                        className="rounded-md px-3 py-2 text-left text-sm hover:bg-muted aria-pressed:bg-muted aria-pressed:font-semibold"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
                <div
                  className={
                    group ? 'rounded-xl bg-muted/50 px-4 py-2' : 'col-span-2'
                  }
                >
                  {group && (
                    <Link
                      href={`/categories/${group.slug}`}
                      onClick={() => setSelection(undefined)}
                    >
                      Ver categoria · {group.label}
                    </Link>
                  )}
                  <ul className="grid grid-cols-2 gap-x-3">
                    {(group
                      ? group.children.map((child) => ({
                          href: `/categories/${child.slug}`,
                          label: child.label,
                        }))
                      : (menu.shortcuts ?? [])
                    ).map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          prefetch={false}
                          onClick={() => setSelection(undefined)}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
