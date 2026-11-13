import { Suspense } from 'react';

import Link from 'next/link';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { pageMetadata } from '~/lib/seo';

export const metadata = pageMetadata(
  'Cadastre sua empresa ou software | Selletive',
  'Encontre sua empresa, assuma um perfil existente ou cadastre um novo perfil gratuito.',
  '/claim',
  false,
);

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.trim().slice(0, 160) : '';
  const term = query.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim();
  const host = query.match(
    /^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[/?#:]|$)/i,
  )?.[1];
  const client = getSupabaseServerClient();
  const [{ data: userData }, results, names] = await Promise.all([
    client.auth.getUser(),
    term
      ? client
          .from('businesses')
          .select('name,slug,website,tier,offering_kind')
          .ilike(host ? 'website' : 'name', `%${host ?? term}%`)
          .order('name')
          .limit(20)
      : null,
    host
      ? client
          .from('businesses')
          .select('name,slug,website,tier,offering_kind')
          .ilike('name', `%${host}%`)
          .order('name')
          .limit(20)
      : null,
  ]);
  if (results?.error || names?.error) throw results?.error ?? names?.error;
  const businesses = [
    ...new Map(
      [...(results?.data ?? []), ...(names?.data ?? [])].map((business) => [
        business.slug,
        business,
      ]),
    ).values(),
  ].slice(0, 20);

  const initial = new URLSearchParams();
  if (host) initial.set('site', host.toLowerCase());
  else if (term) initial.set('name', query);
  const next = '/home/offerings/new' + (initial.size ? `?${initial}` : '');
  const create = userData.user
    ? next
    : `/auth/sign-up?next=${encodeURIComponent(next)}`;

  return (
    <>
      <form className="my-8 flex gap-3" action="/claim" method="get">
        <label htmlFor="claim-search" className="sr-only">
          Nome ou site da empresa
        </label>
        <input
          id="claim-search"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={160}
          required
          placeholder="Nome ou site da empresa"
          className="min-w-0 flex-1 rounded-xl border p-4"
        />
        <button className="bg-primary text-primary-foreground rounded-xl px-6">
          Buscar
        </button>
      </form>
      {businesses.length ? (
        <ul
          className="divide-y rounded-xl border"
          aria-label="Perfis encontrados"
        >
          {businesses.map((business) => (
            <li
              key={business.slug}
              className="flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <p className="font-medium">{business.name}</p>
                <p className="text-muted-foreground text-sm">
                  {business.offering_kind === 'software'
                    ? 'Software'
                    : 'Serviços'}
                  {business.website ? ` · ${business.website}` : ''}
                </p>
              </div>
              <Link
                href={`/claim/${business.slug}`}
                className="text-primary text-sm underline"
              >
                {business.tier === 'unclaimed'
                  ? 'Assumir este perfil'
                  : 'Ver opções de acesso'}
              </Link>
            </li>
          ))}
        </ul>
      ) : term ? (
        <p role="status" className="text-muted-foreground">
          Nenhum perfil encontrado. Você pode buscar novamente ou criar um
          perfil gratuito.
        </p>
      ) : null}
      {term && (
        <>
          <p className="text-muted-foreground mt-6 text-sm">
            Para publicar um perfil novo, use um e-mail confirmado do domínio do
            site.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href={create} className="text-primary font-medium underline">
              Criar novo perfil gratuito →
            </Link>
            {!userData.user && (
              <Link
                href={`/auth/sign-in?next=${encodeURIComponent(next)}`}
                className="text-sm underline"
              >
                Já tenho conta
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function Page(props: Parameters<typeof SearchResults>[0]) {
  return (
    <main className="container mx-auto max-w-3xl flex-1 px-6 py-20">
      <p className="text-muted-foreground mb-4 text-sm">Para empresas</p>
      <h1 className="font-serif text-5xl">
        Qual empresa ou software você quer cadastrar?
      </h1>
      <p className="text-muted-foreground mt-6 text-lg">
        Busque primeiro. Se o perfil já existir, você pode assumir a página. Se
        for novo, crie um perfil gratuito.
      </p>
      <Suspense
        fallback={
          <p role="status" className="mt-8">
            Carregando busca…
          </p>
        }
      >
        <SearchResults {...props} />
      </Suspense>
    </main>
  );
}
