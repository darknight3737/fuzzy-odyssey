'use client';

import { useId, useState } from 'react';

import Link from 'next/link';

import { ChevronDown } from 'lucide-react';

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
        <div key={item.label} className={item.groups ? undefined : 'relative'}>
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
              className={
                menu.groups
                  ? 'absolute inset-x-0 top-full max-h-[75dvh] overflow-y-auto border-b bg-background shadow-lg'
                  : 'absolute top-full left-0 min-w-60 rounded-xl border bg-background p-2 shadow-lg'
              }
            >
              <div
                className={
                  menu.groups
                    ? 'mx-auto grid max-w-6xl grid-cols-[1fr_1fr_2fr] gap-6 px-6 py-5'
                    : undefined
                }
              >
                <ul className="divide-y">
                  {menu.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        className="w-full px-2"
                        href={link.href}
                        onClick={() => setSelection(undefined)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
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
                {group && (
                  <div className="rounded-xl bg-muted/50 px-4 py-2">
                    <h2 className="px-1 text-lg font-semibold">
                      {group.label}
                    </h2>
                    {
                      <Link
                        href={`/categories/${group.slug}`}
                        onClick={() => setSelection(undefined)}
                      >
                        Ver todas as especialidades
                      </Link>
                    }
                    <ul className="grid grid-cols-2 gap-x-3">
                      {group.children
                        .map((child) => categoryLink(child.slug, child.label))
                        .map((link) => (
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
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
