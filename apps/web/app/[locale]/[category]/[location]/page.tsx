import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { connection } from 'next/server';
import { DirectoryFilters, DirectoryPagination } from '~/components/directory-filters';
import { DirectoryResults } from '~/components/directory-results';
import { resolveCategoryFromSlug } from '~/lib/categories/server';
import { directoryPage, filtersFromParams, searchMarketplace, type DirectoryParams } from '~/lib/directory/marketplace';
import { categoryLabel } from '~/lib/directory/category-label';
import { pageMetadata } from '~/lib/seo';
import { getDirectoryClient } from '~/lib/supabase/directory-client';
type Props = { params: Promise<{ category: string; location: string }>; searchParams: Promise<DirectoryParams> };
async function resolve(params: Props['params']) { const { category: slug, location: locationSlug } = await params; const [category, { data: location }] = await Promise.all([resolveCategoryFromSlug(slug), getDirectoryClient().from('locations').select('name,slug').eq('slug',locationSlug).maybeSingle()]); return { slug, category, location, locationSlug }; }
export async function generateMetadata({ params, searchParams }: Props) { await connection(); const { category, location, locationSlug } = await resolve(params); if (!category || !location) return { robots: { index: false, follow: true } }; const query = await searchParams; const result = await searchMarketplace({ category: category.slug, location: locationSlug }); return pageMetadata(`${categoryLabel(category.slug, category.name)} em ${location.name} | Selletive`, `Compare empresas de ${categoryLabel(category.slug, category.name)} em ${location.name}.`, `/${category.slug}/${locationSlug}`, !Object.values(query).some(Boolean) && result.total > 0); }
async function Content({ params, searchParams }: Props) { await connection(); const { slug, category, location, locationSlug } = await resolve(params); if (!category || !location) notFound(); if (slug !== category.slug) permanentRedirect(`/${category.slug}/${locationSlug}`); const query = await searchParams; const page = directoryPage(query); const result = await searchMarketplace({ ...filtersFromParams(query), category: category.slug, location: locationSlug }, page); return <main className="container mx-auto px-6 py-10"><h1 className="font-serif text-4xl">{categoryLabel(category.slug, category.name)} em {location.name}</h1><p className="mt-3 text-muted-foreground">Compare empresas, projetos e avaliações para encontrar o parceiro certo.</p><DirectoryFilters params={query} category={category.slug} location={locationSlug} /><p className="text-sm text-muted-foreground">{result.total} resultados encontrados</p><DirectoryResults items={result.items} /><DirectoryPagination params={query} page={page} total={result.total} /></main>; }
export default function Page(props: Props) { return <Suspense fallback={<div className="container min-h-96 p-12">Carregando…</div>}><Content {...props} /></Suspense>; }
