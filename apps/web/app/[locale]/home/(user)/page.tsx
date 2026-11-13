import { Suspense } from 'react';

import Link from 'next/link';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  AdminHeader,
  TierBadge,
  buttonPrimary,
  buttonSecondary,
  nextStep,
} from '~/components/admin-ui';
import { CompassPageLoader } from '~/components/compass-loader';
import { CompanyLogo } from '~/components/directory-results';

export const metadata = {
  title: 'Minhas empresas | Selletive',
  robots: { index: false, follow: false },
};
async function UserHomePage() {
  await connection();
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: businesses, error } = user
    ? await client
        .from('businesses')
        .select('id,name,slug,tier,description,logo_url,offering_kind')
        .eq('account_id', user.id)
        .order('name')
    : { data: [], error: null };
  if (error) throw error;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 lg:py-10">
      <AdminHeader
        eyebrow="Seu espaço na Selletive"
        title="Minhas empresas"
        description="Gerencie seus perfis, acompanhe pedidos e evolua de plano."
        actions={
          <>
            <Link href="/home/leads" className={buttonSecondary}>
              Pedidos e oportunidades
            </Link>
            <Link href="/home/offerings/new" className={buttonSecondary}>
              Cadastrar serviço ou software
            </Link>
            <Link href="/claim" className={buttonPrimary}>
              Reivindicar uma empresa
            </Link>
          </>
        }
      />
      {businesses?.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {businesses.map((b) => {
            const next = nextStep(b.tier, b.slug);
            return (
              <article
                key={b.id}
                className="flex flex-col rounded-2xl border border-[#dce5e1] bg-white p-6"
              >
                <div className="flex items-start gap-4">
                  <CompanyLogo name={b.name} src={b.logo_url} size={56} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold [overflow-wrap:anywhere] text-[#0f161e]">
                      {b.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <TierBadge tier={b.tier} />
                      <span className="inline-flex h-7 items-center rounded-full bg-[#f7f9f8] px-3 text-[13px] font-medium text-[#333e49]">
                        {b.offering_kind === 'software'
                          ? 'Software'
                          : 'Serviços'}
                      </span>
                    </div>
                  </div>
                </div>
                {b.description ? (
                  <p className="mt-4 line-clamp-2 text-sm text-[#3d3e45]">
                    {b.description}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-[#854d0e]">
                    Seu perfil ainda não tem descrição.
                  </p>
                )}
                {next && (
                  <div className="mt-5 rounded-xl bg-[#f6fefb] p-4">
                    <p className="text-sm font-semibold text-[#0f161e]">
                      {next.title}
                    </p>
                    <Link
                      href={next.href}
                      className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#00756a] hover:text-[#004038] hover:underline"
                    >
                      {next.cta} →
                    </Link>
                  </div>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  <Link
                    href={`/home/businesses/${b.slug}`}
                    className={buttonPrimary}
                  >
                    Gerenciar perfil
                  </Link>
                  <Link href={`/company/${b.slug}`} className={buttonSecondary}>
                    Ver perfil ↗
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#dce5e1] bg-white px-6 py-12 md:px-12">
          <h2 className="text-[26px] leading-tight font-semibold text-[#0f161e]">
            Sua empresa começa aqui
          </h2>
          <p className="mt-2 max-w-[560px] text-[#3d3e45]">
            Em três passos sua empresa fica pronta para receber clientes:
          </p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [
                'Encontre sua empresa',
                'Busque pelo nome. Muitas empresas brasileiras já estão no diretório.',
              ],
              [
                'Reivindique gratuitamente',
                'Entre com o e-mail do mesmo domínio do site da empresa.',
              ],
              [
                'Verifique e receba contatos',
                'Coloque o selo da Selletive no seu site para liberar contatos e avaliações.',
              ],
            ].map(([title, text], index) => (
              <li
                key={title}
                className="rounded-xl border border-[#dce5e1] p-5"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-[#f6fefb] text-sm font-semibold text-[#004038]">
                  {index + 1}
                </span>
                <p className="mt-3 font-semibold text-[#0f161e]">{title}</p>
                <p className="mt-1 text-sm text-[#3d3e45]">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/claim" className={buttonPrimary}>
              Encontrar minha empresa
            </Link>
            <Link href="/home/offerings/new" className={buttonSecondary}>
              Não encontrei: cadastrar do zero
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <UserHomePage />
    </Suspense>
  );
}
