import { Suspense } from 'react';

import Link from 'next/link';
import { connection } from 'next/server';

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
    <main className="mx-auto w-[min(100%-32px,760px)] flex-1 py-12 md:py-20">
      <p className="mb-4 text-sm font-medium text-[#6f7073]">
        Para empresas · Grátis
      </p>
      <h1 className="text-[36px] leading-[1.1] font-semibold tracking-[-0.5px] text-[#0f161e] md:text-[48px]">
        Seu próximo cliente pode estar aqui.
      </h1>
      <p className="mt-6 text-lg text-[#3d3e45]">
        Encontre seu perfil e reivindique gratuitamente. Você precisará entrar
        com um e-mail confirmado do mesmo domínio do site da empresa.
      </p>
      <form className="my-8 flex flex-col gap-2 rounded-xl border border-[#7b8983] bg-white p-2 shadow-[0_2px_8px_rgb(1_38_32/0.06)] sm:flex-row">
        <label htmlFor="claim-search" className="sr-only">
          Nome da empresa
        </label>
        <input
          id="claim-search"
          name="q"
          defaultValue={q}
          maxLength={120}
          placeholder="Busque pelo nome da empresa"
          className="min-h-12 min-w-0 flex-1 rounded-lg px-4 text-base focus-visible:outline-2 focus-visible:outline-[#00756a]"
        />
        <button className="min-h-12 rounded-lg bg-[#004038] px-6 text-[15px] font-semibold text-white hover:bg-[#00544c]">
          Buscar
        </button>
      </form>
      <div className="divide-y divide-[#dce5e1] rounded-xl border border-[#dce5e1] bg-white">
        {data?.map((b) => (
          <Link
            key={b.id}
            href={`/claim/${b.slug}`}
            className="flex flex-wrap items-center justify-between gap-3 p-6 hover:bg-[#f7f9f8]"
          >
            <div>
              <h2 className="font-semibold text-[#0f161e]">{b.name}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{b.website}</p>
            </div>
            <span className="text-sm font-semibold text-[#00756a]">
              Reivindicar →
            </span>
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
  return (
    <Suspense
      fallback={
        <div role="status" className="container mx-auto min-h-96 px-6 py-12">
          Carregando…
        </div>
      }
    >
      <ClaimPage {...props} />
    </Suspense>
  );
}
