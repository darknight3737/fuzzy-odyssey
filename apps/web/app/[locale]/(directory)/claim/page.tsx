import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { pageMetadata } from '~/lib/seo';

export const metadata = pageMetadata(
  'Reivindique sua empresa | Selletive',
  'Encontre sua empresa e assuma o controle do perfil gratuitamente usando seu e-mail corporativo.',
  '/claim',
  false,
);
async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  const { q = '' } = await searchParams;
  const term = q
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .slice(0, 120);
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('businesses')
    .select('id,name,slug,website')
    .eq('tier', 'unclaimed')
    .ilike('name', `%${term}%`)
    .order('name')
    .limit(30);
  if (error) throw error;
  return (
    <main className="container mx-auto max-w-3xl flex-1 px-6 py-20">
      <p className="text-muted-foreground mb-4 text-sm">Para empresas</p>
      <h1 className="font-serif text-5xl">
        Seu próximo cliente pode estar aqui.
      </h1>
      <p className="text-muted-foreground mt-6 text-lg">
        Encontre seu perfil e reivindique gratuitamente. Você precisará entrar
        com um e-mail confirmado do mesmo domínio do site da empresa.
      </p>
      <form className="my-8 flex gap-3">
        <label htmlFor="claim-search" className="sr-only">
          Nome da empresa
        </label>
        <input
          id="claim-search"
          name="q"
          defaultValue={q}
          maxLength={120}
          placeholder="Busque pelo nome da empresa"
          className="min-w-0 flex-1 rounded-xl border p-4"
        />
        <button className="bg-primary text-primary-foreground rounded-xl px-6">
          Buscar
        </button>
      </form>
      <div className="divide-y rounded-xl border">
        {data?.map((b) => (
          <Link
            key={b.id}
            href={`/claim/${b.slug}`}
            className="hover:bg-muted/30 flex flex-wrap items-center justify-between gap-3 p-6"
          >
            <div>
              <h2 className="font-medium">{b.name}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{b.website}</p>
            </div>
            <span className="text-sm">Reivindicar →</span>
          </Link>
        ))}
      </div>
      {!data?.length && (
        <p role="status" className="text-muted-foreground py-8">
          Nenhuma empresa disponível para esta busca. Tente outro nome ou{' '}
          <Link href="/contact" className="underline">
            entre em contato
          </Link>
          .
        </p>
      )}
    </main>
  );
}
export default function Page(props: Parameters<typeof ClaimPage>[0]) {
  return <Suspense fallback={<div role="status" className="container mx-auto min-h-96 px-6 py-12">Carregando…</div>}><ClaimPage {...props} /></Suspense>;
}
