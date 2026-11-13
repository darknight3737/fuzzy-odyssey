import { Suspense } from 'react';

import Link from 'next/link';
import { connection } from 'next/server';

import { CompassPageLoader } from '~/components/compass-loader';
import {
  DirectoryFilters,
  DirectoryPagination,
} from '~/components/directory-filters';
import { DirectoryShortlist } from '~/components/directory-shortlist';
import { DirectoryResults } from '~/components/directory-results';
import {
  directoryPage,
  filtersFromParams,
  searchMarketplace,
  type DirectoryParams,
} from '~/lib/directory/marketplace';
import { getDirectoryOptions } from '~/lib/directory/options';
import { taxonomyKind } from '~/lib/directory/taxonomy';
import { pageMetadata } from '~/lib/seo';
export const metadata = pageMetadata(
  'Buscar empresas e softwares | Selletive',
  'Encontre parceiros e ferramentas para seu negócio.',
  '/search',
  false,
);
type Props = { searchParams: Promise<DirectoryParams> };

const scopes = [
  { kind: '', label: 'Todos' },
  { kind: 'software', label: 'Software' },
  { kind: 'service', label: 'Serviços' },
] as const;

const serviceFilters = [
  'location',
  'min_budget',
  'max_budget',
  'min_team',
  'max_team',
  'founded_before',
  'languages',
  'remote',
  'has_works',
  'has_awards',
];

const softwareFilters = [
  'features',
  'integrations',
  'pricing_model',
  'deployment',
  'buyer_sizes',
  'support_languages',
  'free_trial',
  'free_plan',
  'portuguese',
];

function scopeParams(query: DirectoryParams, kind: string) {
  const params: DirectoryParams = { ...query, kind: kind || undefined };
  const incompatible = [
    ...(kind === 'service' ? [] : serviceFilters),
    ...(kind === 'software' ? [] : softwareFilters),
  ];
  for (const key of incompatible) delete params[key];
  if (
    typeof params.category !== 'string' ||
    taxonomyKind(params.category) !== kind
  ) {
    delete params.category;
  }
  return params;
}

function searchHref(params: DirectoryParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'page' && typeof value === 'string' && value)
      query.set(key, value);
  }
  return `/search${query.size ? '?' + query : ''}`;
}

async function Content({ searchParams }: Props) {
  await connection();
  const query = await searchParams;
  const term = typeof query.q === 'string' ? query.q.trim().slice(0, 120) : '';
  const kind =
    query.kind === 'service' || query.kind === 'software'
      ? query.kind
      : typeof query.category === 'string' && query.category
        ? taxonomyKind(query.category)
        : '';
  const params = scopeParams({ ...query, q: term }, kind);
  const page = kind ? directoryPage(params) : 1;
  const shared = { q: term, min_rating: params.min_rating, sort: params.sort };
  const softwareParams =
    kind === 'software' ? params : { ...shared, kind: 'software' };
  const serviceParams =
    kind === 'service' ? params : { ...shared, kind: 'service' };
  const [software, service, options] = await Promise.all([
    searchMarketplace(
      filtersFromParams(softwareParams),
      kind === 'software' ? page : 1,
    ),
    searchMarketplace(
      filtersFromParams(serviceParams),
      kind === 'service' ? page : 1,
    ),
    getDirectoryOptions(
      typeof params.category === 'string' ? params.category : undefined,
      typeof params.location === 'string' ? params.location : undefined,
      true,
      kind === 'service',
    ),
  ]);
  const result = kind === 'software' ? software : service;
  const allCount = software.total + service.total;
  return (
    <main className="mx-auto w-[min(100%-32px,1200px)] flex-1 pt-12 pb-20">
      <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.5px] [overflow-wrap:anywhere] text-[#0f161e] md:text-[40px]">
        {term ? `Resultados para “${term}”` : 'Encontre seu próximo parceiro'}
      </h1>
      <nav aria-label="Tipo de resultado" className="mt-6 flex flex-wrap gap-2">
        {scopes.map((scope) => {
          const active = scope.kind === kind;
          const total =
            scope.kind === 'software'
              ? software.total
              : scope.kind === 'service'
                ? service.total
                : allCount;
          return (
            <Link
              key={scope.label}
              href={searchHref(
                active ? params : { ...shared, kind: scope.kind },
              )}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00756a] ${active ? 'border-[#004038] bg-[#004038] text-white' : 'border-[#dce5e1] text-[#004038] hover:bg-[#edf7fc]'}`}
            >
              {scope.label}
              {(!kind || active) && (
                <span className="tabular-nums">
                  {total.toLocaleString('pt-BR')}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <DirectoryFilters
        params={params}
        options={options}
        total={kind ? result.total : allCount}
        breadcrumbs={[{ label: 'Busca' }]}
        key={JSON.stringify(params)}
      />
      {kind ? (
        <>
          <div className="mt-10">
            <DirectoryResults
              items={result.items}
              title={
                kind === 'software'
                  ? 'Softwares encontrados'
                  : 'Prestadores de serviço'
              }
              spotlight={
                !term &&
                page === 1 &&
                (!params.sort || params.sort === 'relevance')
              }
            />
          </div>
          <DirectoryPagination
            params={params}
            page={page}
            total={result.total}
          />
        </>
      ) : (
        <div className="mt-10 space-y-12">
          {[
            {
              kind: 'software',
              title: 'Software',
              result: software,
              action: 'Ver todos os softwares',
            },
            {
              kind: 'service',
              title: 'Serviços',
              result: service,
              action: 'Ver todos os serviços',
            },
          ].map((section) => (
            <div key={section.kind}>
              <DirectoryResults
                items={section.result.items.slice(0, 3)}
                title={section.title}
                showShortlist={false}
              />
              {section.result.total > 0 && (
                <Link
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-[#dce5e1] px-4 font-semibold text-[#004038] hover:bg-[#edf7fc]"
                  href={searchHref({ ...shared, kind: section.kind })}
                >
                  {section.action}
                </Link>
              )}
            </div>
          ))}
          <DirectoryShortlist />
        </div>
      )}
    </main>
  );
}
export default function Page(props: Props) {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <Content {...props} />
    </Suspense>
  );
}
