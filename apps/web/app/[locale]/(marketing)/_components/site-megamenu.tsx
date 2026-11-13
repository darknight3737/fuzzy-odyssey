'use client';

import { useEffect, useId, useRef, useState } from 'react';

import Link from 'next/link';

import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';

import {
  serviceGroups,
  softwareMenuGroups,
  type TaxonomyGroup,
} from '~/lib/directory/taxonomy';

type MenuLink = { href: string; label: string };
type Menu = { label: string; links: MenuLink[]; groups?: TaxonomyGroup[] };

const categoryLink = (slug: string, label: string) => ({
  href: `/categories/${slug}`,
  label,
});

const serviceHighlights: Record<string, [string, string][]> = {
  'advertising-marketing': [
    ['advertising-services', 'Publicidade'],
    ['advertising-campaign', 'Campanhas publicitárias'],
    ['branding-services', 'Branding'],
    ['seo-services', 'SEO'],
    ['ppc-sem', 'Mídia paga'],
    ['content-marketing', 'Marketing de conteúdo'],
    ['social-media-marketing', 'Redes sociais'],
  ],
  'creative-visual': [
    ['design-services-specific', 'Design gráfico'],
    ['user-experience-ux-ui-services', 'UX/UI'],
    ['photography-services', 'Fotografia'],
    ['video-production', 'Produção de vídeo'],
  ],
  'development-product': [
    ['software-development', 'Desenvolvimento de software sob encomenda'],
    ['mobile-app-development', 'Desenvolvimento de aplicativos'],
    ['web-development-services', 'Desenvolvimento web'],
    ['web-design-services', 'Web design'],
    ['ecommerce-services', 'Serviços para e-commerce'],
    ['ai-consulting', 'Consultoria de IA'],
    ['data-engineering', 'Engenharia de dados'],
  ],
  'it-services': [
    ['it-consulting-services', 'Consultoria de TI'],
    ['managed-it-services', 'Serviços gerenciados'],
    ['it-support-services', 'Suporte de TI'],
    ['it-outsourcing', 'Terceirização de TI'],
    ['cloud-consulting-services', 'Consultoria em nuvem'],
    ['cyber-security-services', 'Cibersegurança'],
    ['systems-integration', 'Integração de sistemas'],
    ['crm-consulting', 'Implantação de CRM'],
    ['erp-consulting', 'Implantação de ERP'],
  ],
  'financial-professional': [
    ['business-consulting-services', 'Consultoria empresarial'],
    ['accounting-tax-services', 'Contabilidade e tributos'],
    ['business-financial-services', 'Serviços financeiros'],
    ['recruitment-services', 'Recrutamento e seleção'],
    ['training-services', 'Treinamento corporativo'],
    ['legal-services', 'Serviços jurídicos'],
    ['business-operations-services', 'Operações e logística'],
  ],
};

export const siteMenus: Menu[] = [
  {
    label: 'Serviços',
    links: [
      { href: '/search?kind=service', label: 'Explorar serviços' },
      { href: '/projects/new', label: 'Publicar projeto' },
      { href: '/categories#service', label: 'Todas as categorias de Serviços' },
    ],
    groups: serviceGroups.map((group) => ({
      ...group,
      children: (serviceHighlights[group.slug] ?? []).map(([slug, label]) => ({
        slug,
        label,
      })),
    })),
  },
  {
    label: 'Software',
    links: [
      { href: '/search?kind=software', label: 'Explorar softwares' },
      categoryLink('crm-software', 'CRM'),
      categoryLink('erp-software', 'ERP'),
      categoryLink('marketing-automation-software', 'Automação de marketing'),
      {
        href: '/categories#software',
        label: 'Todas as categorias de Software',
      },
    ],
    groups: softwareMenuGroups,
  },
  {
    label: 'Para empresas',
    links: [
      { href: '/home/offerings/new', label: 'Cadastrar empresa ou software' },
      { href: '/claim', label: 'Reivindicar perfil' },
      { href: '/pricing', label: 'Planos e preços' },
    ],
  },
  {
    label: 'Recursos',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: '/help', label: 'Central de ajuda' },
    ],
  },
];

export function SiteMegamenu() {
  const panelId = useId();
  const pendingGroup = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const navigation = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ menu: number; group: number }>();

  const cancelGroup = () => clearTimeout(pendingGroup.current);
  useEffect(() => () => clearTimeout(pendingGroup.current), []);

  const openMenu = (menu: number) => {
    cancelGroup();
    setSelection((current) =>
      current?.menu === menu ? current : { menu, group: 0 },
    );
  };
  const closeMenu = () => {
    cancelGroup();
    setSelection(undefined);
  };

  const isOpen = selection !== undefined;
  // Escape must also dismiss a menu opened by the pointer while focus is elsewhere.
  useEffect(() => {
    if (!isOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const nav = navigation.current;
      if (nav?.contains(document.activeElement)) {
        nav.querySelector<HTMLButtonElement>('[aria-expanded="true"]')?.focus();
      }
      clearTimeout(pendingGroup.current);
      setSelection(undefined);
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [isOpen]);

  return (
    <div
      ref={navigation}
      className="flex h-full items-stretch gap-2"
      onPointerLeave={(event) => {
        if (
          event.pointerType === 'mouse' &&
          !event.currentTarget.querySelector(':focus-visible')
        )
          closeMenu();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
      }}
    >
      {siteMenus.map((menu, index) => {
        const expanded = selection?.menu === index;
        const group = menu.groups?.[expanded ? (selection?.group ?? 0) : 0];

        return (
          <div
            key={menu.label}
            className={menu.groups ? undefined : 'relative'}
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={expanded ? panelId : undefined}
              className="flex h-full items-center gap-1.5 border-b-2 border-transparent px-2 text-sm font-medium whitespace-nowrap hover:text-[#004038] focus-visible:outline-[#00756a] aria-expanded:border-[#00756a] aria-expanded:text-[#004038]"
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') openMenu(index);
              }}
              onClick={(event) => {
                if (
                  expanded &&
                  (event.detail === 0 ||
                    (event.nativeEvent instanceof PointerEvent &&
                      event.nativeEvent.pointerType === 'touch'))
                )
                  closeMenu();
                else openMenu(index);
              }}
            >
              {menu.label}
              <ChevronDown
                className={`size-3.5 ${expanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {expanded && (
              <div
                id={panelId}
                className={
                  menu.groups
                    ? 'absolute inset-x-0 top-full max-h-[75dvh] overflow-y-auto border-b border-[#dce5e1] bg-white shadow-[0_12px_24px_-16px_#01262040]'
                    : 'absolute top-full left-0 w-max min-w-56 rounded-xl border border-[#dce5e1] bg-white p-2 shadow-[0_12px_24px_-16px_#01262050]'
                }
              >
                <div
                  className={
                    menu.groups
                      ? 'mx-auto grid max-w-[1200px] grid-cols-[1fr_1.15fr_2fr] items-start gap-7 px-6 py-7'
                      : undefined
                  }
                >
                  <ul className="space-y-2">
                    {menu.links.map((link, linkIndex) => (
                      <li key={link.href}>
                        <Link
                          className={`w-full justify-between gap-3 rounded-xl px-4 py-3 focus-visible:outline-[#00756a] ${menu.groups && linkIndex === 0 ? 'bg-[#004038] !text-white hover:bg-[#00544c]' : 'hover:bg-[#f6fefb]'}`}
                          href={link.href}
                          onClick={closeMenu}
                        >
                          {link.label}
                          <ArrowUpRight
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {menu.groups && (
                    <div className="grid gap-1.5 border-l border-[#dce5e1] pl-5">
                      {menu.groups.map((item, groupIndex) => (
                        <button
                          type="button"
                          key={item.slug}
                          aria-pressed={group?.slug === item.slug}
                          onPointerEnter={(event) => {
                            if (event.pointerType !== 'mouse') return;
                            cancelGroup();
                            pendingGroup.current = setTimeout(() => {
                              setSelection((current) =>
                                current?.menu === index
                                  ? { menu: index, group: groupIndex }
                                  : current,
                              );
                            }, 140);
                          }}
                          onPointerLeave={cancelGroup}
                          onClick={() => {
                            cancelGroup();
                            setSelection({ menu: index, group: groupIndex });
                          }}
                          className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm leading-snug hover:bg-[#edf7fc] focus-visible:outline-[#00756a] aria-pressed:font-semibold aria-pressed:text-[#012620] ${menu.label === 'Software' ? 'aria-pressed:bg-[#dfe6f1]' : 'aria-pressed:bg-[#eaf8f1]'}`}
                        >
                          {item.label}
                          <ArrowRight
                            className={`size-3.5 shrink-0 text-[#00756a] ${group?.slug === item.slug ? '' : 'invisible'}`}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {group && (
                    <div
                      className={`rounded-2xl border p-5 ${menu.label === 'Software' ? 'border-[#c4cfde] bg-[#dfe6f1]' : 'border-[#dce5e1] bg-[#f6fefb]'}`}
                    >
                      <h2 className="px-2 text-lg font-semibold text-[#004038]">
                        {group.label}
                      </h2>
                      <ul className="mt-3 grid grid-cols-2 gap-2">
                        {group.children.map((child) => (
                          <li key={child.slug}>
                            <Link
                              className="w-full rounded-lg border border-transparent px-3 py-2.5 hover:border-[#c4cfde] hover:bg-white focus-visible:outline-[#00756a]"
                              href={`/categories/${child.slug}`}
                              prefetch={false}
                              onClick={closeMenu}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        className="mt-3 gap-2 rounded-lg px-3 !text-[#00665b] focus-visible:outline-[#00756a]"
                        href={`/categories/${group.slug}`}
                        onClick={closeMenu}
                      >
                        Ver todas as especialidades
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
