import { Suspense } from 'react';

import { connection } from 'next/server';

import {
  DirectoryFilters,
  DirectoryPagination,
} from '~/components/directory-filters';
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
async function Content({ searchParams }: Props) {
  await connection();
  const query = await searchParams;
  const kind =
    query.kind === 'service' || query.kind === 'software'
      ? query.kind
      : undefined;
  const category =
    typeof query.category === 'string' &&
    (!kind || taxonomyKind(query.category) === kind)
      ? query.category
      : undefined;
  const params = { ...query, kind, category };
  const page = directoryPage(params);
  const filters = filtersFromParams({
    ...params,
    kind: kind ?? (category ? taxonomyKind(category) : undefined),
  });
  const [result, options] = await Promise.all([
    searchMarketplace(filters, page),
    getDirectoryOptions(
      typeof params.category === 'string' ? params.category : undefined,
      typeof params.location === 'string' ? params.location : undefined,
      true,
      true,
    ),
  ]);
  return (
    <main className="mx-auto w-[min(100%-32px,1200px)] flex-1 pt-12 pb-20">
      <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.5px] [overflow-wrap:anywhere] text-[#0f161e] md:text-[40px]">
        Encontre seu próximo parceiro
        {typeof params.q === 'string' && params.q.trim()
          ? ': ' + params.q.trim().slice(0, 120)
          : ''}
      </h1>
      <DirectoryFilters
        params={params}
        options={options}
        total={result.total}
        breadcrumbs={[{ label: 'Busca' }]}
        key={JSON.stringify(params)}
      />
      <div className="mt-10">
        <DirectoryResults
          items={result.items}
          spotlight={
            page === 1 && (!filters.sort || filters.sort === 'relevance')
          }
        />
      </div>
      <DirectoryPagination params={params} page={page} total={result.total} />
    </main>
  );
}
export default function Page(props: Props) {
  return (
    <Suspense
      fallback={<div className="container min-h-96 p-12">Carregando…</div>}
    >
      <Content {...props} />
    </Suspense>
  );
}
