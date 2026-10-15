import Link from 'next/link';

import { ArrowRight, Building2, Check, Compass, Search } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import appConfig from '~/config/app.config';
import { withI18n } from '~/lib/i18n/with-i18n';
import { pageMetadata, serializeJsonLd } from '~/lib/seo';

export const metadata = pageMetadata(
  'Selletive — Encontre o próximo parceiro da sua empresa',
  'Descubra empresas e prestadores de serviços B2B. Compare especialidades, localização e avaliações para escolher seu próximo parceiro.',
  '/',
);

async function Home() {
  const client = getSupabaseServerClient();
  const [{ data: categories, error }, { data: businesses }] = await Promise.all(
    [
      client
        .from('categories')
        .select('id, name, slug, description')
        .eq('is_active', true)
        .eq('level', 1)
        .order('name')
        .limit(12),
      client
        .from('businesses')
        .select('id, name, slug, description, tier')
        .order('name')
        .limit(4),
    ],
  );
  if (error) throw error;
  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Selletive',
            url: appConfig.url,
            inLanguage: 'pt-BR',
          }),
        }}
      />
      <section className="border-b bg-[#f6f5f1] text-[#172b26]">
        <div className="container mx-auto grid gap-16 px-6 py-20 lg:grid-cols-[1.3fr_1fr] lg:py-28">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[.2em]">
              Boas parcerias começam aqui
            </p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.08] tracking-tight md:text-7xl">
              O próximo passo da sua empresa.
              <br />
              <span className="text-[#597665]">O parceiro certo.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#53645c]">
              Encontre especialistas para transformar suas ideias em resultados.
              Explore empresas, conheça suas especialidades e escolha com
              confiança.
            </p>
            <form
              action="/search"
              role="search"
              className="mt-9 flex max-w-xl flex-col gap-3 rounded-2xl border bg-white p-3 shadow-sm sm:flex-row"
            >
              <label htmlFor="provider-search" className="sr-only">
                Qual serviço você procura?
              </label>
              <div className="flex flex-1 items-center gap-3 px-2">
                <Search aria-hidden="true" className="h-5 w-5 shrink-0" />
                <input
                  id="provider-search"
                  name="q"
                  maxLength={120}
                  placeholder="Qual serviço você procura?"
                  className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none"
                />
              </div>
              <button
                data-test="homepage-search"
                className="rounded-xl bg-[#233e33] px-6 py-3 font-medium text-white hover:bg-[#355643]"
              >
                Encontrar empresas
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-5 text-xs text-[#53645c]">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Busca gratuita
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Contato direto
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Sem compromisso
              </span>
            </div>
          </div>
          <div
            className="relative flex flex-col justify-center gap-4 lg:pl-8"
            aria-label="Como encontrar seu parceiro"
          >
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#e1e8dc]">
              <Compass className="h-8 w-8" />
            </div>
            <p className="font-serif text-3xl">
              Especialistas para cada desafio.
            </p>
            {[
              'Marketing que aproxima.',
              'Design que faz a diferença.',
              'Tecnologia que leva além.',
            ].map((text, i) => (
              <Link
                key={text}
                href="/categories"
                className="group flex items-center gap-5 rounded-2xl border border-[#dedfd7] bg-white/70 p-6 transition-transform hover:-translate-y-1"
              >
                <span className="font-serif text-2xl text-[#87947e]">
                  0{i + 1}
                </span>
                <span className="flex-1 font-medium">{text}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
            <p className="mt-3 text-sm text-[#53645c]">
              Uma escolha bem informada muda tudo.
            </p>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-6 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-muted-foreground mb-3 text-xs uppercase tracking-widest">
              Encontre sua especialidade
            </p>
            <h2 className="font-serif text-4xl">Do desafio à solução.</h2>
          </div>
          <Link
            href="/categories"
            className="flex items-center gap-2 text-sm underline underline-offset-4"
          >
            Todas as categorias <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((category) => (
            <Link
              href={`/categories/${category.slug}`}
              key={category.id}
              className="hover:bg-muted/40 group rounded-2xl border p-7 transition-colors"
            >
              <Building2 className="mb-8 h-6 w-6 text-[#597665]" />
              <h3 className="flex items-center justify-between text-lg font-semibold">
                {category.name}
                <ArrowRight className="h-4 w-4" />
              </h3>
              <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
                {category.description ||
                  `Conheça empresas especializadas em ${category.name.toLowerCase()}.`}
              </p>
            </Link>
          ))}
        </div>
        {!categories?.length && (
          <p className="text-muted-foreground rounded-2xl border p-8">
            Estamos preparando nosso diretório. As categorias e empresas
            aparecerão aqui assim que forem cadastradas.
          </p>
        )}
      </section>
      {!!businesses?.length && (
        <section className="container mx-auto px-6 pb-20">
          <h2 className="mb-8 font-serif text-4xl">
            Conheça quem faz acontecer.
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {businesses.map((b) => (
              <Link
                href={`/company/${b.slug}`}
                key={b.id}
                className="hover:bg-muted/30 rounded-2xl border p-6"
              >
                <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf0e8] font-serif text-xl">
                  {b.name.charAt(0)}
                </span>
                <h3 className="text-lg font-semibold">{b.name}</h3>
                <p className="text-muted-foreground mt-3 line-clamp-3 text-sm">
                  {b.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm">
                  Conhecer empresa <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="bg-[#edf0e8] py-20">
        <div className="container mx-auto grid gap-10 px-6 md:grid-cols-3">
          {[
            [
              '01',
              'Explore as possibilidades',
              'Busque por especialidade e localização. Encontre empresas que atendem ao seu desafio.',
            ],
            [
              '02',
              'Conheça os detalhes',
              'Compare serviços, equipes e avaliações publicadas. Monte sua própria seleção.',
            ],
            [
              '03',
              'Converse com quem entende',
              'Acesse o site ou os contatos da empresa e dê o próximo passo diretamente.',
            ],
          ].map(([n, title, copy]) => (
            <div key={n}>
              <span className="text-sm text-[#597665]">{n}</span>
              <h2 className="mt-4 font-serif text-2xl">{title}</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="container mx-auto flex flex-col items-start justify-between gap-8 px-6 py-20 md:flex-row md:items-center">
        <div>
          <p className="text-muted-foreground mb-3 text-xs uppercase tracking-widest">
            Para quem faz acontecer
          </p>
          <h2 className="font-serif text-4xl">
            Sua empresa merece ser encontrada.
          </h2>
          <p className="text-muted-foreground mt-4">
            Reivindique seu perfil gratuitamente e mantenha suas informações
            atualizadas.
          </p>
        </div>
        <Link
          href="/claim"
          className="shrink-0 rounded-full bg-[#233e33] px-7 py-4 text-sm font-medium text-white"
        >
          Encontrar minha empresa →
        </Link>
      </section>
    </main>
  );
}
export default withI18n(Home);
