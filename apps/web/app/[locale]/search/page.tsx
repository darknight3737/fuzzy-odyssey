import { Suspense } from 'react';
import { connection } from 'next/server';
import { DirectoryFilters, DirectoryPagination } from '~/components/directory-filters';
import { DirectoryResults } from '~/components/directory-results';
import { directoryPage, filtersFromParams, searchMarketplace, type DirectoryParams } from '~/lib/directory/marketplace';
import { pageMetadata } from '~/lib/seo';
export const metadata = pageMetadata('Buscar empresas e softwares | Selletive', 'Encontre parceiros e ferramentas para seu negócio.', '/search', false);
type Props = { searchParams: Promise<DirectoryParams> };
async function Content({ searchParams }: Props) { await connection(); const params = await searchParams; const page = directoryPage(params); const result = await searchMarketplace(filtersFromParams(params), page); return <main className="container mx-auto px-6 py-12"><h1 className="font-serif text-4xl">Encontre seu próximo parceiro</h1><DirectoryFilters params={params} /><p className="text-sm text-muted-foreground">{result.total} resultados encontrados</p><DirectoryResults items={result.items} /><DirectoryPagination params={params} page={page} total={result.total} /></main>; }
export default function Page(props: Props) { return <Suspense fallback={<div className="container min-h-96 p-12">Carregando…</div>}><Content {...props} /></Suspense>; }
