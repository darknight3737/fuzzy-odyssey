import Link from 'next/link';

import { ArrowUpRight, Check, ChevronDown } from 'lucide-react';

import { type BusinessTier, isPremium } from '~/lib/plans';

export interface StepBusiness {
  slug: string;
  tier: BusinessTier;
  verification_status: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  offering_kind: string;
  features: string[];
  business_categories: unknown[];
  business_services: unknown[];
  business_cases: unknown[];
}

export function NextSteps({
  business: b,
  compact = false,
}: {
  business: StepBusiness;
  compact?: boolean;
}) {
  const base = `/home/businesses/${b.slug}`;
  const software = b.offering_kind === 'software';
  const verified = b.verification_status === 'verified';
  const premium = isPremium(b.tier);
  const tasks = [
    {
      title: 'Complete os dados básicos',
      done: !!(b.logo_url && b.description?.trim() && b.website),
      href: 'editar#informacoes',
    },
    {
      title: 'Revise suas categorias',
      done: b.business_categories.length > 0,
      href: 'editar#categorias',
    },
    {
      title: software
        ? 'Adicione recursos do software'
        : 'Cadastre seu primeiro serviço',
      done: (software ? b.features : b.business_services).length > 0,
      href: software ? 'editar#detalhes' : 'editar#servicos',
    },
    {
      title: 'Publique seu primeiro case',
      done: b.business_cases.length > 0,
      href: 'editar#cases',
    },
    ...(!premium
      ? [
          {
            title: 'Verifique grátis com o selo',
            done: verified,
            href: 'selos',
            note: 'Ative contatos e avaliações',
          },
        ]
      : []),
  ];
  const completed = tasks.filter((task) => task.done).length;
  const upgrade = {
    title: premium
      ? 'Veja onde aparecer com Spotlight'
      : 'Conheça Destaque e Spotlight',
    href: 'promote#planos',
  };
  const list = (
    <>
      <div
        role="progressbar"
        aria-label="Configuração do perfil"
        aria-valuemin={0}
        aria-valuemax={tasks.length}
        aria-valuenow={completed}
        className="my-3 flex gap-1"
      >
        {tasks.map((task, i) => (
          <span
            key={task.title}
            className={`h-1 flex-1 rounded-full ${i < completed ? 'bg-[#004038]' : 'bg-[#dce5e1]'}`}
          />
        ))}
      </div>
      <ul
        className={
          compact ? 'space-y-1' : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3'
        }
      >
        {tasks.map((task) => (
          <li key={task.title}>
            <Link
              href={`${base}/${task.href}`}
              className={`flex items-center gap-2 rounded-xl text-sm hover:bg-[#f7f9f8] ${compact ? 'px-2 py-2' : 'border border-[#dce5e1] p-3'}`}
            >
              <span className="min-w-0 flex-1">
                {task.title}
                {'note' in task && task.note && !task.done && (
                  <small className="block text-[#52635d]">{task.note}</small>
                )}
              </span>
              {task.done ? (
                <Check
                  aria-label="Concluído"
                  className="size-4 shrink-0 text-[#00665b]"
                />
              ) : (
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
              )}
            </Link>
          </li>
        ))}
      </ul>
      {premium && (
        <Link className="mt-3 block text-sm underline" href={`${base}/selos`}>
          {verified
            ? 'Ver selo confirmado'
            : 'Publicar selo no site (opcional)'}
        </Link>
      )}
      {b.tier !== 'spotlight' && (
        <Link
          className="mt-3 inline-block text-sm font-medium text-[#004038] underline"
          href={`${base}/${upgrade.href}`}
        >
          {upgrade.title} ↗
        </Link>
      )}
    </>
  );
  return compact ? (
    <details className="rounded-2xl border border-[#dce5e1] bg-white p-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
        <span>
          {completed}/{tasks.length}
        </span>
        <span className="flex-1">Próximos passos</span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </summary>
      {list}
    </details>
  ) : (
    <section className="rounded-2xl border border-[#dce5e1] bg-white p-5 sm:p-7">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Próximos passos</h2>
        <span className="text-sm">
          {completed}/{tasks.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-[#52635d]">
        Prepare seu perfil para receber oportunidades.
      </p>
      {list}
    </section>
  );
}
