import type { ReactNode } from 'react';

import Link from 'next/link';

import { AdminHeader, TierBadge, buttonSecondary } from '~/components/admin-ui';

import { NextSteps, type StepBusiness } from './next-steps';

const sections = [
  ['overview', 'Visão geral'],
  ['editar', 'Editar perfil'],
  ['oportunidades', 'Oportunidades'],
  ['avaliacoes', 'Avaliações'],
  ['selos', 'Selos'],
  ['desempenho', 'Desempenho'],
  ['promote', 'Planos e visibilidade'],
] as const;

export type DashboardSection = (typeof sections)[number][0];

export function BusinessDashboard({
  business,
  section,
  children,
}: {
  business: StepBusiness & { name: string };
  section: DashboardSection;
  children: ReactNode;
}) {
  const base = `/home/businesses/${business.slug}`;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-[#0f161e] md:px-8 lg:py-10">
      <AdminHeader
        back={{ href: '/home', label: 'Minhas ofertas' }}
        eyebrow={
          business.offering_kind === 'software' ? 'Software' : 'Serviços'
        }
        title={business.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <TierBadge tier={business.tier} />
            <span>·</span>
            <span>
              {business.verification_status === 'verified'
                ? 'Vínculo com site confirmado'
                : 'Vínculo com site não confirmado'}
            </span>
          </span>
        }
        actions={
          <Link className={buttonSecondary} href={`/company/${business.slug}`}>
            Ver perfil público ↗
          </Link>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-[#dce5e1] bg-white p-3 lg:sticky lg:top-4 lg:flex lg:min-h-[420px] lg:flex-col">
          <nav
            aria-label="Painel da oferta"
            className="flex flex-wrap gap-1 lg:flex-col"
          >
            {sections.map(([id, title]) => (
              <Link
                key={id}
                href={id === 'overview' ? base : `${base}/${id}`}
                aria-current={section === id ? 'page' : undefined}
                className="rounded-lg px-3 py-2 text-sm hover:bg-[#f7f9f8] aria-[current=page]:bg-[#eaf8f1] aria-[current=page]:font-semibold"
              >
                {title}
              </Link>
            ))}
          </nav>
          <div className="lg:mt-auto">
            {section !== 'overview' && (
              <NextSteps business={business} compact />
            )}
            <Link
              href="/home/settings"
              className="mt-3 block px-2 text-sm text-[#52635d]"
            >
              Configurações da conta
            </Link>
          </div>
        </aside>
        <div className="min-w-0 space-y-6">
          <h2 className="text-2xl font-semibold">
            {sections.find(([id]) => id === section)?.[1]}
          </h2>
          {children}
        </div>
      </div>
    </main>
  );
}
