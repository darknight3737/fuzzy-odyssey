import Link from 'next/link';

import { z } from 'zod';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { withI18n } from '~/lib/i18n/with-i18n';
import { pageMetadata } from '~/lib/seo';

import { SearchResultsList } from './_components/search-results-list';

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    page?: string;
  }>;
};
export const metadata = pageMetadata(
  'Buscar empresas e serviços | Selletive',
  'Encontre especialistas por serviço, categoria e localização.',
  '/search',
  false,
);
async function SearchPage({ searchParams }: Props) {
  const params = z
    .object({
      q: z.string().max(120).catch(''),
      category: z.string().max(200).optional().catch(undefined),
      location: z.string().max(200).optional().catch(undefined),
      page: z.string().optional().catch(undefined),
    })
    .parse(await searchParams);
  const term = (params.q ?? '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .slice(0, 120);
  const page = /^[1-9][0-9]{0,4}$/.test(params.page ?? '')
    ? Number(params.page)
    : 1;
  const client = getSupabaseServerClient();
  const [
    { data: businesses, error, count },
    { data: categories },
    { data: locations },
  ] = await Promise.all([
    client
      .rpc(
        'search_directory',
        {
          search_term: term,
          category_slug: params.category || undefined,
          location_slug: params.location || undefined,
        },
        { count: 'exact' },
      )
      .select('id,name,slug,description,logo_url,tier')
      .range((page - 1) * 24, page * 24 - 1),
    client
      .from('categories')
      .select('name,slug')
      .eq('is_active', true)
      .order('name'),
    client.from('locations').select('name,slug').order('name').limit(500),
  ]);
  if (error) throw error;
  const pageUrl = (number: number) => {
    const query = new URLSearchParams();
    if (term) query.set('q', term);
    if (params.category) query.set('category', params.category);
    if (params.location) query.set('location', params.location);
    query.set('page', String(number));
    return `/search?${query}`;
  };
  return (
    <main className="container mx-auto flex-1 px-6 py-12">
      <p className="text-muted-foreground mb-3 text-sm">
        Uma boa parceria começa com uma escolha
      </p>
      <h1 className="font-serif text-4xl md:text-5xl">
        {term ? `Resultados para “${term}”` : 'Encontre seu próximo parceiro'}
      </h1>
      <form
        action="/search"
        className="bg-muted/20 my-8 grid gap-4 rounded-2xl border p-5 md:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <label className="text-xs font-medium">
          Serviço ou empresa
          <input
            name="q"
            defaultValue={params.q}
            maxLength={120}
            placeholder="O que você procura?"
            className="bg-background mt-2 block w-full rounded-lg border p-3 text-sm"
          />
        </label>
        <label className="text-xs font-medium">
          Categoria
          <select
            name="category"
            defaultValue={params.category ?? ''}
            className="bg-background mt-2 block w-full rounded-lg border p-3 text-sm"
          >
            <option value="">Todas as categorias</option>
            {categories?.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium">
          Localização
          <select
            name="location"
            defaultValue={params.location ?? ''}
            className="bg-background mt-2 block w-full rounded-lg border p-3 text-sm"
          >
            <option value="">Todas as localidades</option>
            {locations?.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <button className="bg-primary text-primary-foreground self-end rounded-lg px-6 py-3 text-sm">
          Buscar
        </button>
      </form>
      <p role="status" className="text-muted-foreground mb-6 text-sm">
        {count ?? 0} empresas encontradas
      </p>
      <SearchResultsList businesses={businesses ?? []} />
      <nav
        aria-label="Paginação"
        className="mt-10 flex justify-between text-sm"
      >
        {page > 1 ? (
          <Link
            href={pageUrl(page - 1)}
            className="rounded-full border px-5 py-3"
          >
            ← Anterior
          </Link>
        ) : (
          <span />
        )}
        <span className="text-muted-foreground self-center">Página {page}</span>
        {(count ?? 0) > page * 24 ? (
          <Link
            href={pageUrl(page + 1)}
            className="rounded-full border px-5 py-3"
          >
            Próxima →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
export default withI18n(SearchPage);
