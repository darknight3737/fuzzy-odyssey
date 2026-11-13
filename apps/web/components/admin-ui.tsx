import Link from 'next/link';

import {
  ArrowRight,
  BadgeCheck,
  Check,
  Circle,
  Lock,
  Rocket,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { TIER_LABELS, type BusinessTier, tierRank } from '~/lib/plans';

const tierStyles: Record<BusinessTier, string> = {
  unclaimed: 'bg-[#f7f9f8] text-[#333e49]',
  claimed: 'bg-[#f7f9f8] text-[#333e49]',
  verified: 'bg-[#f6fefb] text-[#004038]',
  highlight: 'bg-[#004038] text-white',
  spotlight: 'bg-[#012620] text-[#7edcaf]',
};

export function TierBadge({ tier }: { tier: string }) {
  const key = (tier in tierStyles ? tier : 'claimed') as BusinessTier;
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ${tierStyles[key]}`}
    >
      {key === 'verified' && (
        <BadgeCheck aria-hidden="true" className="size-3.5" />
      )}
      Plano {TIER_LABELS[key]}
    </span>
  );
}

export function AdminHeader({
  eyebrow,
  title,
  description,
  back,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="inline-flex min-h-11 items-center text-sm font-medium text-[#00756a] hover:text-[#004038] hover:underline"
        >
          ← {back.label}
        </Link>
      )}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-sm font-medium text-[#6f7073]">{eyebrow}</p>
          )}
          <h1 className="text-[26px] leading-[1.2] font-semibold tracking-[-0.3px] [overflow-wrap:anywhere] text-[#0f161e] md:text-[32px]">
            {title}
          </h1>
          {description && (
            <div className="mt-2 max-w-[640px] text-[#3d3e45]">
              {description}
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export const buttonPrimary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#004038] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#00544c] active:bg-[#00332d]';
export const buttonSecondary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#7b8983] bg-white px-5 text-[15px] font-semibold text-[#004038] transition-colors hover:bg-[#f6fefb]';
export const buttonAccent =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1fbc88] px-5 text-[15px] font-semibold text-[#012620] transition-colors hover:bg-[#1aaf7e] active:bg-[#15976d]';

export function AdminSection({
  id,
  step,
  title,
  description,
  status,
  children,
}: {
  id: string;
  step?: number;
  title: string;
  description?: string;
  status?: { done: boolean; label: string };
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 rounded-2xl border border-[#dce5e1] bg-white p-6 md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {step != null && (
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f6fefb] text-sm font-semibold text-[#004038]"
            >
              {step}
            </span>
          )}
          <div>
            <h2
              id={`${id}-title`}
              className="text-lg font-semibold text-[#0f161e]"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 max-w-[620px] text-sm text-[#3d3e45]">
                {description}
              </p>
            )}
          </div>
        </div>
        {status && (
          <span
            className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ${status.done ? 'bg-[#eaf8f1] text-[#00665b]' : 'bg-[#fff8e6] text-[#854d0e]'}`}
          >
            {status.done ? (
              <Check aria-hidden="true" className="size-3.5" />
            ) : (
              <Circle aria-hidden="true" className="size-3" />
            )}
            {status.label}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function LockedFeature({
  title,
  description,
  plan,
  href,
}: {
  title: string;
  description: string;
  plan: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-[#c4cfde] bg-[#f7f9f8] p-6 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#6f7073]">
        <Lock aria-hidden="true" className="size-5" />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-[#0f161e]">{title}</p>
        <p className="mt-1 text-sm text-[#3d3e45]">{description}</p>
      </div>
      <Link href={href} className={buttonSecondary}>
        Liberar com {plan}
      </Link>
    </div>
  );
}

const journey: Array<{
  tier: BusinessTier;
  title: string;
  text: string;
  icon: LucideIcon;
}> = [
  {
    tier: 'claimed',
    title: 'Perfil reivindicado',
    text: 'Você controla as informações da empresa.',
    icon: Check,
  },
  {
    tier: 'verified',
    title: 'Verificado',
    text: 'Grátis com o selo no seu site. Libera contatos e avaliações.',
    icon: BadgeCheck,
  },
  {
    tier: 'highlight',
    title: 'Destaque',
    text: 'Vitrine completa para gerar pedidos de orçamento.',
    icon: Sparkles,
  },
  {
    tier: 'spotlight',
    title: 'Spotlight',
    text: 'Exposição máxima nas buscas da sua categoria.',
    icon: Rocket,
  },
];

export function nextStep(tier: string, slug: string) {
  const rank = tierRank(tier);
  if (rank < 2)
    return {
      title: 'Próximo passo: verificar seu perfil gratuitamente',
      text: 'Coloque o selo da Selletive no site da sua empresa. Depois da conferência, você passa a receber contatos e avaliações de clientes.',
      cta: 'Começar verificação',
      href: `/home/businesses/${slug}/promote#verificacao`,
    };
  if (rank === 2)
    return {
      title: 'Próximo passo: transformar o perfil em canal de vendas',
      text: 'Com o Destaque, sua empresa ganha capa, galeria, vídeo, até 15 cases e mais exposição nas buscas compatíveis.',
      cta: 'Conhecer o Destaque',
      href: `/home/businesses/${slug}/promote#planos`,
    };
  if (rank === 3)
    return {
      title: 'Próximo passo: ampliar sua exposição',
      text: 'O Spotlight coloca sua empresa nos espaços patrocinados da sua categoria e região.',
      cta: 'Conhecer o Spotlight',
      href: `/home/businesses/${slug}/promote#planos`,
    };
  return null;
}

export function JourneySteps({ tier, slug }: { tier: string; slug: string }) {
  const rank = tierRank(tier);
  const next = nextStep(tier, slug);
  return (
    <section
      aria-labelledby="journey-title"
      className="rounded-2xl border border-[#dce5e1] bg-white p-6 md:p-8"
    >
      <h2 id="journey-title" className="text-lg font-semibold text-[#0f161e]">
        Sua jornada na Selletive
      </h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-4">
        {journey.map((step, index) => {
          const stepRank = tierRank(step.tier);
          const done = rank >= stepRank;
          const current = rank === stepRank;
          const Icon = step.icon;
          return (
            <li
              key={step.tier}
              aria-current={current ? 'step' : undefined}
              className={`rounded-xl border p-4 ${current ? 'border-[#004038] bg-[#f6fefb]' : 'border-[#dce5e1]'}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-8 items-center justify-center rounded-full ${done ? 'bg-[#004038] text-white' : 'bg-[#f7f9f8] text-[#6f7073]'}`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="text-[13px] font-medium text-[#6f7073]">
                  Etapa {index + 1}
                  {done && <span className="sr-only"> concluída</span>}
                  {current && ' · Você está aqui'}
                </span>
              </div>
              <p className="mt-3 font-semibold text-[#0f161e]">{step.title}</p>
              <p className="mt-1 text-sm text-[#3d3e45]">{step.text}</p>
            </li>
          );
        })}
      </ol>
      {next && (
        <div className="mt-6 flex flex-col items-start gap-4 rounded-xl bg-[#004038] p-6 text-white md:flex-row md:items-center">
          <div className="flex-1">
            <p className="font-semibold">{next.title}</p>
            <p className="mt-1 text-sm text-[#c4ded4]">{next.text}</p>
          </div>
          <Link href={next.href} className={buttonAccent}>
            {next.cta}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

export type ChecklistItem = { label: string; done: boolean; href: string };

export function ProfileChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((item) => item.done).length;
  const percent = Math.round((done / Math.max(1, items.length)) * 100);
  return (
    <section
      aria-labelledby="checklist-title"
      className="rounded-2xl border border-[#dce5e1] bg-white p-6 md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="checklist-title"
            className="text-lg font-semibold text-[#0f161e]"
          >
            Perfil {percent}% completo
          </h2>
          <p className="mt-1 text-sm text-[#3d3e45]">
            Perfis completos passam mais confiança e aparecem melhor nas buscas.
          </p>
        </div>
        <p className="text-sm text-[#6f7073]">
          {done} de {items.length} itens
        </p>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef2f0]"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-[#1fbc88]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="mt-6 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-[#f7f9f8]"
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full ${item.done ? 'bg-[#00665b] text-white' : 'border border-[#7b8983]'}`}
              >
                {item.done && <Check aria-hidden="true" className="size-3" />}
              </span>
              <span
                className={
                  item.done ? 'text-[#6f7073] line-through' : 'text-[#0f161e]'
                }
              >
                {item.label}
              </span>
              <span className="sr-only">
                {item.done ? '(concluído)' : '(pendente)'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
