import { Suspense } from 'react';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  AdminHeader,
  AdminSection,
  type ChecklistItem,
  JourneySteps,
  LockedFeature,
  ProfileChecklist,
  TierBadge,
  buttonPrimary,
  buttonSecondary,
} from '~/components/admin-ui';
import { canReceiveContacts, getPlanLimits, isPremium } from '~/lib/plans';

import { BusinessAnalytics } from './_components/business-analytics';
import { BusinessEditor } from './_components/business-editor';
import { ContentEditor } from './_components/content-editor';
import { DetailsEditor } from './_components/details-editor';
import { GalleryEditor } from './_components/gallery-editor';
import { ResponseEditor } from './_components/response-editor';
import { TaxonomyEditor } from './_components/taxonomy-editor';

export const metadata = {
  title: 'Gerenciar empresa | Selletive',
  robots: { index: false, follow: false },
};
async function ManageBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  const { data: b, error } = await client
    .from('businesses')
    .select(
      '*,business_services(id,title,description,price_range),business_cases(id,title,description,client_name,challenge,solution,results,industry,project_type,duration,budget_range,images),business_awards(id,title,description,issuer),business_gallery(id,image_url,caption),business_categories(category_id),business_locations(location_id),reviews(id,title,content,status,review_responses(id,response_text,status))',
    )
    .eq('slug', slug)
    .eq('account_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!b) notFound();
  const [{ data: categories }, { data: locations }] = await Promise.all([
    client
      .from('categories')
      .select('id,name')
      .eq('is_active', true)
      .order('name'),
    client.from('locations').select('id,name').order('name'),
  ]);
  const { data: vendors } = await client
    .from('businesses')
    .select('id,name')
    .eq('account_id', user.id)
    .eq('offering_kind', 'service')
    .neq('id', b.id)
    .order('name');
  const socials =
    b.social_links &&
    typeof b.social_links === 'object' &&
    !Array.isArray(b.social_links)
      ? b.social_links
      : {};
  const limits = getPlanLimits(b.tier);
  const address =
    b.address && typeof b.address === 'object' && !Array.isArray(b.address)
      ? b.address
      : {};
  const premium = isPremium(b.tier);
  const canContact = canReceiveContacts(b.tier);
  const software = b.offering_kind === 'software';
  const promote = `/home/businesses/${slug}/promote`;
  const checklist: ChecklistItem[] = [
    { label: 'Logo da empresa', done: !!b.logo_url, href: '#informacoes' },
    {
      label: 'Descrição com pelo menos 150 caracteres',
      done: (b.description ?? '').length >= 150,
      href: '#informacoes',
    },
    { label: 'Site da empresa', done: !!b.website, href: '#informacoes' },
    {
      label: 'Categoria principal',
      done: b.business_categories.length > 0,
      href: '#categorias',
    },
    {
      label: 'Localização',
      done: b.business_locations.length > 0,
      href: '#categorias',
    },
    software
      ? {
          label: 'Recursos do software',
          done: b.features.length > 0,
          href: '#detalhes',
        }
      : {
          label: 'Pelo menos 1 serviço',
          done: b.business_services.length > 0,
          href: '#servicos',
        },
    {
      label: 'Pelo menos 1 case',
      done: b.business_cases.length > 0,
      href: '#cases',
    },
    software
      ? {
          label: 'Modelo de preços',
          done: !!b.pricing_model,
          href: '#detalhes',
        }
      : {
          label: 'Tamanho da equipe',
          done: b.employee_count != null,
          href: '#informacoes',
        },
  ];
  const nav = [
    ['desempenho', 'Desempenho'],
    ['informacoes', 'Informações básicas'],
    ['detalhes', 'Detalhes do perfil'],
    ['categorias', 'Categorias e localização'],
    ['servicos', software ? 'Planos e serviços' : 'Serviços'],
    ['cases', 'Cases'],
    ['premios', 'Prêmios'],
    ['galeria', 'Galeria'],
    ['avaliacoes', 'Avaliações'],
  ] as const;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 lg:py-10">
      <AdminHeader
        back={{ href: '/home', label: 'Minhas empresas' }}
        eyebrow={software ? 'Software' : 'Prestador de serviços'}
        title={b.name}
        description={<TierBadge tier={b.tier} />}
        actions={
          <>
            <Link href={`/company/${slug}`} className={buttonSecondary}>
              Ver perfil público ↗
            </Link>
            <Link href={promote} className={buttonPrimary}>
              Planos e verificação
            </Link>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <JourneySteps tier={b.tier} slug={slug} />
        <ProfileChecklist items={checklist} />
      </div>
      {!premium && (
        <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-[#f6fefb] p-6 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="font-semibold text-[#0f161e]">
              Quantos pedidos de orçamento seu perfil pode gerar?
            </p>
            <p className="mt-1 text-sm text-[#3d3e45]">
              Faça uma simulação com suas próprias hipóteses e veja o que
              Destaque e Spotlight oferecem para transformar visitas em
              oportunidades.
            </p>
          </div>
          <Link href={`${promote}#simulacao`} className={buttonSecondary}>
            Simular potencial
          </Link>
        </div>
      )}
      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav
          aria-label="Seções do painel"
          className="hidden lg:sticky lg:top-6 lg:block lg:self-start"
        >
          <ul className="space-y-1">
            {nav.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-[#333e49] hover:bg-[#f6fefb] hover:text-[#004038]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-6">
          <AdminSection
            id="desempenho"
            title="Desempenho do perfil"
            description="Quantas pessoas viram seu perfil e clicaram nos seus contatos. São contagens indicativas, não vendas."
          >
            <BusinessAnalytics
              client={client}
              businessId={b.id}
              tier={b.tier}
            />
          </AdminSection>
          <AdminSection
            id="informacoes"
            step={1}
            title="Informações básicas"
            description="O que aparece no topo do seu perfil e nos cards das buscas. Comece por aqui."
          >
            <BusinessEditor
              values={{
                id: b.id,
                slug: b.slug,
                name: b.name,
                description: b.description ?? '',
                website: b.website ?? '',
                email: b.email ?? '',
                phone: b.phone ?? '',
                logo_url: b.logo_url ?? '',
                employee_count: b.employee_count,
                founded_year: b.founded_year,
                works_remotely: b.works_remotely,
              }}
            />
          </AdminSection>
          <AdminSection
            id="detalhes"
            step={2}
            title="Detalhes do perfil"
            description={
              software
                ? 'Recursos, integrações, preços e suporte. Esses dados alimentam os filtros de quem procura software.'
                : 'Clientes, setores atendidos, história da equipe e redes sociais.'
            }
          >
            <DetailsEditor
              vendors={vendors ?? []}
              paid={premium}
              values={{
                id: b.id,
                slug: b.slug,
                offering_kind:
                  b.offering_kind === 'software' ? 'software' : 'service',
                vendor_business_id: b.vendor_business_id ?? '',
                features: b.features.join(', '),
                integrations: b.integrations.join(', '),
                clients: b.clients.join(', '),
                sectors: b.sectors.join(', '),
                team_story: b.team_story ?? '',
                team_photo_url: b.team_photo_url ?? '',
                pricing_model: b.pricing_model ?? '',
                deployment: b.deployment.join(', '),
                support_languages: b.support_languages.join(', '),
                buyer_sizes: b.buyer_sizes.join(', '),
                linkedin:
                  typeof socials.linkedin === 'string' ? socials.linkedin : '',
                instagram:
                  typeof socials.instagram === 'string'
                    ? socials.instagram
                    : '',
                address_text:
                  typeof address.description === 'string'
                    ? address.description
                    : '',
                video_url: b.video_url ?? '',
                calendar_url: b.calendar_url ?? '',
                cover_image_url: b.cover_image_url ?? '',
                custom_cta_url: b.custom_cta_url ?? '',
                custom_cta_label: b.custom_cta_label ?? '',
                free_trial: b.free_trial,
                free_plan: b.free_plan,
                portuguese: b.portuguese,
              }}
            />
          </AdminSection>
          <AdminSection
            id="categorias"
            step={3}
            title="Categorias e localização"
            description="Escolha onde sua empresa deve aparecer. Marque somente o que você realmente oferece."
            status={{
              done:
                b.business_categories.length > 0 &&
                b.business_locations.length > 0,
              label:
                b.business_categories.length > 0 &&
                b.business_locations.length > 0
                  ? 'Preenchido'
                  : 'Pendente',
            }}
          >
            <TaxonomyEditor
              businessId={b.id}
              slug={b.slug}
              kind="category"
              options={categories ?? []}
              selected={b.business_categories.map((item) => item.category_id)}
            />
            <TaxonomyEditor
              businessId={b.id}
              slug={b.slug}
              kind="location"
              options={locations ?? []}
              selected={b.business_locations.map((item) => item.location_id)}
            />
          </AdminSection>
          <AdminSection
            id="servicos"
            step={4}
            title={software ? 'Planos e serviços' : 'Serviços'}
            description="Cada serviço vira uma linha no seu perfil, com descrição e preço inicial."
            status={{
              done: b.business_services.length > 0,
              label: `${b.business_services.length} cadastrado${b.business_services.length === 1 ? '' : 's'}`,
            }}
          >
            <ContentEditor
              businessId={b.id}
              slug={b.slug}
              kind="service"
              items={b.business_services.map((item) => ({
                ...item,
                detail: item.price_range ?? '',
              }))}
            />
          </AdminSection>
          <AdminSection
            id="cases"
            step={5}
            title="Cases"
            description={`Mostre trabalhos reais: problema, solução e resultado. Seu plano permite até ${limits.cases} ${limits.cases === 1 ? 'case publicado' : 'cases publicados'}.`}
            status={{
              done: b.business_cases.length > 0,
              label: `${b.business_cases.length} de ${limits.cases}`,
            }}
          >
            <ContentEditor
              businessId={b.id}
              slug={b.slug}
              kind="case"
              paid={premium}
              items={b.business_cases.map((item) => ({
                ...item,
                detail: item.client_name ?? '',
              }))}
            />
            {!premium && (
              <div className="mt-4">
                <LockedFeature
                  title="Até 15 cases com imagens"
                  description="No Destaque, cada case pode ter imagens e aparece com mais destaque no seu portfólio."
                  plan="Destaque"
                  href={`${promote}#planos`}
                />
              </div>
            )}
          </AdminSection>
          <AdminSection
            id="premios"
            step={6}
            title="Prêmios e certificações"
            description="Reconhecimentos, parcerias oficiais e certificações da sua empresa."
          >
            <ContentEditor
              businessId={b.id}
              slug={b.slug}
              kind="award"
              items={b.business_awards.map((item) => ({
                ...item,
                description: item.description ?? '',
                detail: item.issuer,
              }))}
            />
          </AdminSection>
          <AdminSection
            id="galeria"
            title="Galeria de imagens"
            description={
              software
                ? 'Telas do produto para o comprador ver como o software funciona.'
                : 'Fotos de trabalhos, equipe e escritório.'
            }
          >
            {premium ? (
              <GalleryEditor
                businessId={b.id}
                slug={b.slug}
                items={b.business_gallery}
              />
            ) : (
              <LockedFeature
                title="Galeria com até 20 imagens, capa e vídeo"
                description="Disponível nos planos Destaque e Spotlight."
                plan="Destaque"
                href={`${promote}#planos`}
              />
            )}
          </AdminSection>
          <AdminSection
            id="avaliacoes"
            title="Avaliações de clientes"
            description="Responder com cuidado mostra que sua empresa acompanha cada cliente."
          >
            {canContact ? (
              (() => {
                const approved = b.reviews.filter(
                  (review) => review.status === 'approved',
                );
                return approved.length ? (
                  <div className="space-y-4">
                    {approved.map((review) => {
                      const response = review.review_responses.find(
                        (item) => item.status === 'active',
                      );
                      return (
                        <article
                          key={review.id}
                          className="rounded-xl border border-[#dce5e1] p-5"
                        >
                          <strong className="text-[#0f161e]">
                            {review.title}
                          </strong>
                          <p className="mt-2 text-sm text-[#3d3e45]">
                            {review.content}
                          </p>
                          <ResponseEditor
                            businessId={b.id}
                            slug={b.slug}
                            reviewId={review.id}
                            responseId={response?.id}
                            response={response?.response_text}
                          />
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#f7f9f8] p-5 text-sm text-[#3d3e45]">
                    Ainda não há avaliações aprovadas. Peça a clientes recentes
                    que avaliem sua empresa pelo seu perfil público.
                  </p>
                );
              })()
            ) : (
              <LockedFeature
                title="Receba e responda avaliações"
                description="Verifique seu perfil gratuitamente com o selo da Selletive para liberar avaliações e contatos."
                plan="Verificado"
                href={`${promote}#verificacao`}
              />
            )}
          </AdminSection>
        </div>
      </div>
    </main>
  );
}
export default function Page(props: Parameters<typeof ManageBusinessPage>[0]) {
  return (
    <Suspense
      fallback={
        <div role="status" className="container mx-auto min-h-96 px-6 py-12">
          Carregando…
        </div>
      }
    >
      <ManageBusinessPage {...props} />
    </Suspense>
  );
}
