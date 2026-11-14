import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { AdminSection, LockedFeature } from '~/components/admin-ui';
import appConfig from '~/config/app.config';
import { taxonomyKind } from '~/lib/directory/taxonomy';
import { canReceiveContacts, getPlanLimits, isPremium } from '~/lib/plans';

import { Inbox } from '../../../leads/_components/inbox';
import { BadgeVerification } from '../promote/_components/badge-verification';
import { BusinessAnalytics } from './business-analytics';
import { BusinessDashboard, type DashboardSection } from './business-dashboard';
import { BusinessEditor } from './business-editor';
import { ContentEditor } from './content-editor';
import { DetailsEditor } from './details-editor';
import { GalleryEditor } from './gallery-editor';
import { NextSteps } from './next-steps';
import { ResponseEditor } from './response-editor';
import { TaxonomyEditor } from './taxonomy-editor';

export async function ManageBusinessPage({
  params,
  section = 'overview',
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  section?: DashboardSection;
  searchParams?: Promise<{ onboarding?: string }>;
}) {
  await connection();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
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
  const [{ data: categories }, { data: locations }, { data: vendors }] =
    section === 'editar'
      ? await Promise.all([
          client
            .from('categories')
            .select('id,name,slug')
            .eq('is_active', true)
            .order('name'),
          client.from('locations').select('id,name').order('name'),
          client
            .from('businesses')
            .select('id,name')
            .eq('account_id', user.id)
            .eq('offering_kind', 'service')
            .neq('id', b.id)
            .order('name'),
        ])
      : ([{ data: null }, { data: null }, { data: null }] as const);
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
  const base = `/home/businesses/${slug}`;
  const verified = b.verification_status === 'verified';
  const pending =
    section === 'overview' && canContact
      ? await client
          .from('lead_recipients')
          .select('brief_id,lead_briefs!inner(status)')
          .eq('business_id', b.id)
          .eq('status', 'new')
          .eq('lead_briefs.status', 'open')
          .limit(1)
          .maybeSingle()
      : null;
  return (
    <BusinessDashboard business={b} section={section}>
      {section === 'overview' && (
        <>
          {query?.onboarding === 'published' && b.tier === 'claimed' && (
            <section className="bg-muted/50 space-y-2 rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Seu perfil está no ar</h2>
              <p>
                Confira a página que os compradores veem e compartilhe o link.
              </p>
              <Link href={`/company/${slug}`} className="underline">
                Abrir página publicada
              </Link>
            </section>
          )}
          {pending?.data && (
            <section className="rounded-xl border border-[#dce5e1] bg-[#eaf8f1] p-4">
              <p className="font-medium">
                Você tem uma oportunidade para responder.
              </p>
              <Link
                className="mt-2 inline-block underline"
                href={`/home/leads/${pending.data.brief_id}`}
              >
                Responder oportunidade
              </Link>
            </section>
          )}
          <NextSteps business={b} />
        </>
      )}
      {section === 'desempenho' && (
        <div
          id="desempenho"
          className="scroll-mt-24 rounded-2xl border border-[#dce5e1] bg-white px-6 md:px-8 [&>section]:my-6 [&>section]:border-0 [&>section]:p-0"
        >
          <BusinessAnalytics client={client} businessId={b.id} tier={b.tier} />
        </div>
      )}
      {section === 'editar' && (
        <>
          <nav
            aria-label="Seções do perfil"
            className="flex flex-wrap gap-3 text-sm underline"
          >
            {[
              ['informacoes', 'Informações básicas'],
              [
                'detalhes',
                software
                  ? 'Produto, preços e links'
                  : 'Equipe, clientes e links',
              ],
              ['categorias', 'Categorias e localização'],
              ['servicos', software ? 'Planos e serviços' : 'Serviços'],
              ['cases', 'Cases e portfólio'],
              ['premios', 'Prêmios e certificações'],
              ['galeria', 'Galeria e vídeo'],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
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
              options={(categories ?? []).filter(
                (category) =>
                  taxonomyKind(category.slug) === b.offering_kind ||
                  b.business_categories.some(
                    (link) => link.category_id === category.id,
                  ),
              )}
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
        </>
      )}
      {section === 'selos' && (
        <BadgeVerification
          business={b}
          siteUrl={appConfig.url}
          verified={verified}
          premium={premium}
        />
      )}
      {section === 'oportunidades' && <Inbox businessId={b.id} />}
      {section === 'avaliacoes' && (
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
              href={`${base}/selos`}
            />
          )}
        </AdminSection>
      )}
    </BusinessDashboard>
  );
}
