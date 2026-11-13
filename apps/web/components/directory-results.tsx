'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  BadgeCheck,
  Briefcase,
  Cloud,
  Gift,
  Globe,
  LayoutGrid,
  List,
  MapPin,
  ShieldCheck,
  ThumbsUp,
  Users,
  Wallet,
} from 'lucide-react';

import { DirectoryImage } from '~/components/directory-image';
import {
  DirectorySaveButton,
  DirectoryShortlist,
} from '~/components/directory-shortlist';
import { RatingInline, formatBRL } from '~/components/directory-ui';
import type { DirectoryItem } from '~/lib/directory/marketplace';

type Layout = 'grid' | 'list';

const managedTiers = ['claimed', 'verified', 'highlight', 'spotlight'];
const verifiedTiers = ['verified', 'highlight', 'spotlight'];

function initials(name: string) {
  return (
    name
      .replace(/[^\p{L}\p{N} ]/gu, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '·'
  );
}

export function CompanyLogo({
  name,
  src,
  size = 64,
}: {
  name: string;
  src: string | null;
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#dce5e1] bg-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        <DirectoryImage
          src={src}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span
          aria-hidden="true"
          className="font-semibold text-[#004038]"
          style={{ fontSize: Math.round(size / 3) }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}

export function TrustMarks({ tier }: { tier: string }) {
  if (!managedTiers.includes(tier)) return null;
  return (
    <span className="flex items-center gap-1">
      <span
        title="Perfil gerenciado pela própria empresa"
        className="flex size-6 items-center justify-center rounded-md bg-[#f7f9f8] text-[#333e49]"
      >
        <ShieldCheck aria-hidden="true" className="size-3.5" />
        <span className="sr-only">Perfil gerenciado pela própria empresa</span>
      </span>
      {verifiedTiers.includes(tier) && (
        <span
          title="Presença conferida pela Selletive no site da empresa"
          className="inline-flex h-6 items-center gap-1 rounded-full bg-[#f6fefb] px-2 text-[12px] font-medium text-[#004038]"
        >
          <BadgeCheck aria-hidden="true" className="size-3.5" />
          Verificada
        </span>
      )}
    </span>
  );
}

function Attribute({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 text-left text-sm text-[#3d3e45]">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-[#6f7073]"
      />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function attributes(item: DirectoryItem) {
  const b = item.business;
  const budget =
    b.min_budget != null ? (
      <>
        A partir de <strong>{formatBRL(b.min_budget)}</strong>
      </>
    ) : (
      'Orçamento sob consulta'
    );
  const location = item.location_name ? (
    <>
      Localizada em <strong>{item.location_name}</strong>
    </>
  ) : b.works_remotely ? (
    'Atende remotamente'
  ) : (
    'Localização não informada'
  );
  if (b.offering_kind === 'software') {
    const plans = [
      b.free_plan && 'Plano grátis',
      b.free_trial && 'Teste grátis',
    ].filter(Boolean);
    return [
      {
        icon: Gift,
        content: plans.length
          ? plans.join(' · ')
          : (b.pricing_model ?? 'Modelo de preço não informado'),
      },
      { icon: Wallet, content: budget },
      {
        icon: Cloud,
        content: b.deployment?.length
          ? b.deployment.slice(0, 3).join(', ')
          : 'Implantação não informada',
      },
      {
        icon: Globe,
        content: b.portuguese ? 'Disponível em português' : location,
      },
    ];
  }
  return [
    {
      icon: Briefcase,
      content: item.works_count ? (
        <>
          <strong>{item.works_count}</strong>{' '}
          {item.works_count === 1 ? 'projeto publicado' : 'projetos publicados'}
        </>
      ) : (
        'Nenhum projeto publicado'
      ),
    },
    { icon: MapPin, content: location },
    { icon: Wallet, content: budget },
    {
      icon: Users,
      content:
        b.employee_count != null ? (
          <>
            <strong>{b.employee_count}</strong>{' '}
            {b.employee_count === 1 ? 'pessoa' : 'pessoas'} na equipe
          </>
        ) : (
          'Equipe não informada'
        ),
    },
  ];
}

function DirectoryCard({
  item,
  sponsored = false,
  layout,
}: {
  item: DirectoryItem;
  sponsored?: boolean;
  layout: Layout;
}) {
  const { business: b, average_rating, review_count } = item;
  const wellRated = review_count >= 3 && Number(average_rating) >= 4.5;
  const list = layout === 'list';
  return (
    <article
      data-test="directory-card"
      className={`relative flex rounded-xl border border-[#dce5e1] bg-white transition-colors hover:border-[#7b8983] ${list ? 'flex-col md:flex-row' : 'flex-col'}`}
    >
      <div className="absolute top-2 right-2">
        <DirectorySaveButton
          variant="icon"
          business={{
            id: b.id,
            name: b.name,
            slug: b.slug,
            kind: b.offering_kind,
          }}
        />
      </div>
      <div
        className={`flex flex-1 flex-col p-6 pt-14 ${list ? 'md:flex-row md:items-start md:gap-6' : 'items-center text-center'}`}
      >
        <div className="absolute top-4 left-4">
          <TrustMarks tier={b.tier} />
        </div>
        <CompanyLogo name={b.name} src={b.logo_url} />
        <div
          className={`flex min-w-0 flex-1 flex-col ${list ? 'mt-4 md:mt-6 md:pr-8' : 'mt-4 items-center'}`}
        >
          <h3 className="text-lg leading-snug font-semibold [overflow-wrap:anywhere] text-[#0f161e]">
            <Link
              href={`/company/${b.slug}`}
              className="hover:underline focus-visible:underline"
            >
              {b.name}
            </Link>
          </h3>
          <div className="mt-1">
            <RatingInline
              rating={average_rating}
              count={review_count}
              compact
            />
          </div>
          {b.description && (
            <p className="mt-3 line-clamp-2 text-sm text-[#3d3e45]">
              {b.description}
            </p>
          )}
          <div
            className={`mt-4 flex flex-wrap gap-2 ${list ? '' : 'justify-center'}`}
          >
            {sponsored && (
              <span
                title="Esta empresa paga por posição de destaque. Patrocínio não é avaliação de qualidade."
                className="inline-flex h-7 items-center rounded-full border border-[#dce5e1] px-3 text-[13px] font-medium text-[#333e49]"
              >
                Patrocinado
              </span>
            )}
            <span className="inline-flex h-7 items-center rounded-full bg-[#f7f9f8] px-3 text-[13px] font-medium text-[#333e49]">
              {b.offering_kind === 'software' ? 'Software' : 'Serviços'}
            </span>
            {wellRated && (
              <span
                title="Nota média de 4,5 ou mais em pelo menos 3 avaliações"
                className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#f6fefb] px-3 text-[13px] font-medium text-[#004038]"
              >
                <ThumbsUp aria-hidden="true" className="size-3.5" />
                Bem avaliada
              </span>
            )}
          </div>
        </div>
      </div>
      <div
        className={`flex flex-col gap-4 border-[#dce5e1] bg-[#f7f9f8] p-6 ${list ? 'rounded-b-xl border-t md:w-[320px] md:rounded-r-xl md:rounded-bl-none md:border-t-0 md:border-l' : 'mt-auto rounded-b-xl border-t'}`}
      >
        <ul className="space-y-3">
          {attributes(item).map((row, index) => (
            <Attribute key={index} icon={row.icon}>
              {row.content}
            </Attribute>
          ))}
        </ul>
        <Link
          href={`/company/${b.slug}`}
          className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-[#004038] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#00544c] active:bg-[#00332d]"
        >
          Ver perfil
          <span className="sr-only"> de {b.name}</span>
        </Link>
      </div>
    </article>
  );
}

function LayoutToggle({
  layout,
  onChange,
}: {
  layout: Layout;
  onChange: (layout: Layout) => void;
}) {
  const option = (value: Layout, label: string, Icon: typeof List) => (
    <button
      type="button"
      aria-pressed={layout === value}
      onClick={() => onChange(value)}
      className={`flex size-11 items-center justify-center rounded-lg transition-colors ${layout === value ? 'bg-[#f6fefb] text-[#004038]' : 'text-[#6f7073] hover:text-[#004038]'}`}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span className="sr-only">{label}</span>
    </button>
  );
  return (
    <div
      role="group"
      aria-label="Visualização"
      className="hidden gap-1 md:flex"
    >
      {option('grid', 'Grade', LayoutGrid)}
      {option('list', 'Lista', List)}
    </div>
  );
}

export function DirectoryResults({
  items,
  spotlight = false,
  title = 'Todas as empresas',
  featuredTitle = 'Empresas em destaque',
}: {
  items: DirectoryItem[];
  spotlight?: boolean;
  title?: string;
  featuredTitle?: string;
}) {
  const [layout, setLayout] = useState<Layout>('grid');
  const grid =
    layout === 'grid'
      ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
      : 'grid gap-6';
  const promoted = spotlight
    ? items.filter((item) => item.business.tier === 'spotlight').slice(0, 3)
    : [];
  const organic = items.filter(
    (item) =>
      !promoted.some((promotion) => promotion.business.id === item.business.id),
  );
  return (
    <>
      <DirectoryShortlist />
      {promoted.length > 0 && (
        <section aria-labelledby="directory-featured" className="mb-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="directory-featured"
                className="text-lg font-semibold text-[#0f161e]"
              >
                {featuredTitle}
              </h2>
              <p className="text-sm text-[#6f7073]">
                Posições patrocinadas. Patrocínio não é avaliação de qualidade.
              </p>
            </div>
            <LayoutToggle layout={layout} onChange={setLayout} />
          </div>
          <div className={grid}>
            {promoted.map((item) => (
              <DirectoryCard
                key={item.business.id}
                item={item}
                layout={layout}
                sponsored
              />
            ))}
          </div>
        </section>
      )}
      <section aria-labelledby="directory-all">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2
            id="directory-all"
            className="text-lg font-semibold text-[#0f161e]"
          >
            {title}
          </h2>
          {promoted.length === 0 && (
            <LayoutToggle layout={layout} onChange={setLayout} />
          )}
        </div>
        {items.length === 0 ? (
          <div className="rounded-xl border border-[#dce5e1] bg-[#f7f9f8] px-6 py-12 text-center">
            <p className="font-semibold text-[#0f161e]">
              Nenhuma empresa encontrada
            </p>
            <p className="mt-2 text-sm text-[#3d3e45]">
              Remova alguns filtros ou amplie a localização para ver mais
              resultados.
            </p>
          </div>
        ) : (
          <div className={grid}>
            {organic.map((item) => (
              <DirectoryCard
                key={item.business.id}
                item={item}
                layout={layout}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
