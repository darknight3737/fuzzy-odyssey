import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import {
  Boxes,
  CalendarDays,
  ExternalLink,
  Flag,
  Images,
  Info,
  Languages,
  Laptop,
  Mail,
  PenTool,
  Star,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';

import { CompassPageLoader } from '~/components/compass-loader';
import { DirectoryImage } from '~/components/directory-image';
import { CompanyLogo, TrustMarks } from '~/components/directory-results';
import { DirectorySaveButton } from '~/components/directory-shortlist';
import {
  DirectoryBreadcrumbs,
  Stars,
  formatBRL,
  formatRating,
  reviewCountLabel,
} from '~/components/directory-ui';
import appConfig from '~/config/app.config';
import { categoryLabel } from '~/lib/directory/category-label';
import { taxonomyKind } from '~/lib/directory/taxonomy';
import { pageMetadata, safeWebsite, serializeJsonLd } from '~/lib/seo';
import { socialImageUrl } from '~/lib/social-images';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import { BusinessInfo } from './_components/business-info';
import {
  BusinessContactLink,
  BusinessView,
} from './_components/business-interest';
import {
  ChipList,
  Fact,
  ProfileSection,
  type ProfileTab,
  ProfileTabs,
  QuoteStrip,
  ServicesTable,
} from './_components/profile-parts';
import { ProfileStickyBar } from './_components/profile-sticky-bar';
import { ReviewsSection } from './_components/reviews-section';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  await connection();
  const { slug } = await params;
  const client = getDirectoryClient();

  const { data: business, error } = await client
    .from('businesses')
    .select('name, description, updated_at')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!business) return { title: 'Business Not Found' };

  return pageMetadata(
    `${business.name} — Serviços e avaliações | Selletive`,
    business.description?.slice(0, 160) ||
      `Conheça ${business.name}, seus serviços e informações de contato na Selletive.`,
    `/company/${slug}`,
    true,
    socialImageUrl('company', slug, business.updated_at),
  );
}

async function BusinessProfilePage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const client = getDirectoryClient();

  const { data: business, error } = await client
    .from('businesses')
    .select(
      `
      *,
      business_categories(is_primary, categories(name, slug, is_active)),
      business_locations(locations(name, slug)),
      business_services(*),
      business_awards(*),
      business_cases(*),
      business_gallery(*),
      reviews(id, reviewer_name, rating, title, content, status, created_at, dimensions, review_responses(response_text, status))
    `,
    )
    .eq('slug', slug)
    .order('created_at', { referencedTable: 'reviews', ascending: false })
    .limit(24, { referencedTable: 'reviews' })
    .limit(15, { referencedTable: 'business_cases' })
    .limit(20, { referencedTable: 'business_gallery' })
    .limit(50, { referencedTable: 'business_services' })
    .limit(50, { referencedTable: 'business_awards' })
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!business) notFound();

  const caseLimit =
    business.tier === 'claimed'
      ? 1
      : business.tier === 'verified'
        ? 3
        : ['highlight', 'spotlight'].includes(business.tier)
          ? 15
          : 0;
  const socials =
    business.social_links &&
    typeof business.social_links === 'object' &&
    !Array.isArray(business.social_links)
      ? business.social_links
      : {};
  const address =
    business.address &&
    typeof business.address === 'object' &&
    !Array.isArray(business.address)
      ? business.address
      : {};
  const [{ data: products }, { data: vendor }, { data: ratings }] =
    await Promise.all([
      client
        .from('businesses')
        .select('name,slug')
        .eq('vendor_business_id', business.id)
        .eq('offering_kind', 'software')
        .limit(24),
      business.vendor_business_id
        ? client
            .from('businesses')
            .select('name,slug')
            .eq('id', business.vendor_business_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      client
        .from('reviews')
        .select('rating')
        .eq('business_id', business.id)
        .eq('status', 'approved')
        .limit(5000),
    ]);
  const cases = (business.business_cases ?? []).slice(0, caseLimit);
  const ratingCount = ratings?.length ?? 0;
  const ratingAverage = ratingCount
    ? (ratings ?? []).reduce((sum, item) => sum + item.rating, 0) / ratingCount
    : 0;
  const premium = ['highlight', 'spotlight'].includes(business.tier);
  const canContact = ['verified', 'highlight', 'spotlight'].includes(
    business.tier,
  );
  const website = canContact ? safeWebsite(business.website) : undefined;
  const socialLinks = canContact
    ? (['linkedin', 'instagram'] as const).flatMap((network) => {
        const value = socials[network];
        const href = typeof value === 'string' ? safeWebsite(value) : undefined;
        return href
          ? [{ label: network === 'linkedin' ? 'LinkedIn' : 'Instagram', href }]
          : [];
      })
    : [];
  const activeCategories = (business.business_categories ?? []).filter(
    (entry) =>
      entry.categories?.is_active &&
      taxonomyKind(entry.categories.slug) === business.offering_kind,
  );
  const primaryCategory = (
    activeCategories.find((entry) => entry.is_primary) ?? activeCategories[0]
  )?.categories;
  const locationNames = (business.business_locations ?? [])
    .map((entry) => entry.locations?.name)
    .filter((name): name is string => !!name);
  const gallery = premium ? business.business_gallery.slice(0, 20) : [];
  const video = premium ? safeWebsite(business.video_url) : undefined;
  const calendar = premium ? safeWebsite(business.calendar_url) : undefined;
  const customCta =
    premium && business.custom_cta_label
      ? safeWebsite(business.custom_cta_url)
      : undefined;
  const isSoftware = business.offering_kind === 'software';
  const hasTeam =
    !!business.team_story ||
    !!business.team_photo_url ||
    business.clients.length > 0 ||
    business.sectors.length > 0;
  const saved = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    kind: business.offering_kind,
  };
  const tabs: ProfileTab[] = [
    { id: 'sobre', label: 'Sobre', icon: Info },
    ...(isSoftware ? [{ id: 'software', label: 'Recursos', icon: Boxes }] : []),
    ...(business.business_services.length
      ? [{ id: 'servicos', label: 'Serviços', icon: PenTool }]
      : []),
    { id: 'portfolio', label: 'Portfólio', icon: Images },
    ...(hasTeam ? [{ id: 'equipe', label: 'Equipe', icon: Users }] : []),
    ...(business.business_awards.length
      ? [{ id: 'premios', label: 'Prêmios', icon: Trophy }]
      : []),
    { id: 'avaliacoes', label: 'Avaliações', icon: Star },
    { id: 'contato', label: 'Contato', icon: Mail },
  ];
  const memberSince =
    business.tier !== 'unclaimed' && business.created_at
      ? new Date(business.created_at).getFullYear()
      : null;
  const languages = business.business_languages ?? [];

  return (
    <div className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': isSoftware ? 'SoftwareApplication' : 'Organization',
            ...(isSoftware
              ? {
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web',
                }
              : {}),
            '@id': `${appConfig.url}/company/${business.slug}#organization`,
            name: business.name,
            description: business.description || undefined,
            url: `${appConfig.url}/company/${business.slug}`,
            logo: safeWebsite(business.logo_url),
            sameAs: website ? [website] : undefined,
          }),
        }}
      />
      <BusinessView businessId={business.id} />
      <div className="mx-auto w-[min(100%-32px,1200px)] pt-6">
        <DirectoryBreadcrumbs
          items={[
            { label: 'Categorias', href: '/categories' },
            ...(primaryCategory
              ? [
                  {
                    label: categoryLabel(
                      primaryCategory.slug,
                      primaryCategory.name,
                    ),
                    href: `/categories/${primaryCategory.slug}`,
                  },
                ]
              : []),
            { label: business.name },
          ]}
        />
        <div className="mt-6 overflow-hidden rounded-t-2xl border border-b-0 border-[#dce5e1]">
          {premium && business.cover_image_url ? (
            <div className="h-40 md:h-64">
              <DirectoryImage
                src={business.cover_image_url}
                alt=""
                width={1200}
                height={256}
                sizes="(max-width: 1232px) 100vw, 1200px"
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="h-24 bg-[#f6fefb] md:h-32"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgb(0 64 56 / 0.08) 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />
          )}
          <div className="relative bg-white px-6 md:px-10">
            <div className="-mt-12 inline-block rounded-xl bg-white p-1 md:-mt-14">
              <CompanyLogo
                name={business.name}
                src={business.logo_url}
                size={96}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto w-[min(100%-32px,1200px)] pb-24">
        <ProfileTabs tabs={tabs} />
        <section
          id="sobre"
          aria-labelledby="profile-name"
          className="grid scroll-mt-[136px] gap-8 py-10 lg:grid-cols-[1fr_320px] lg:gap-12"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                id="profile-name"
                className="text-[26px] leading-[1.2] font-semibold tracking-[-0.3px] [overflow-wrap:anywhere] text-[#0f161e] md:text-[32px]"
              >
                {business.name}
              </h1>
              <TrustMarks tier={business.tier} />
            </div>
            <p className="mt-2 text-sm text-[#3d3e45]">
              {[
                isSoftware ? 'Software' : 'Serviços',
                primaryCategory &&
                  categoryLabel(primaryCategory.slug, primaryCategory.name),
                locationNames[0] ??
                  (business.works_remotely ? 'Atende remotamente' : null),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {vendor && (
              <p className="mt-2 text-sm text-[#3d3e45]">
                Produto de{' '}
                <Link
                  className="text-[#00756a] underline"
                  href={`/company/${vendor.slug}`}
                >
                  {vendor.name}
                </Link>
              </p>
            )}
            {business.description ? (
              business.description.length > 360 ? (
                <details className="group mt-6 max-w-[720px] text-[#3d3e45]">
                  <summary className="cursor-pointer list-none">
                    <span className="line-clamp-4 whitespace-pre-line group-open:line-clamp-none">
                      {business.description}
                    </span>
                    <span className="mt-1 inline-block text-sm font-semibold text-[#00756a] underline group-open:hidden">
                      Ver mais
                    </span>
                  </summary>
                </details>
              ) : (
                <p className="mt-6 max-w-[720px] whitespace-pre-line text-[#3d3e45]">
                  {business.description}
                </p>
              )
            ) : (
              <p className="mt-6 text-sm text-[#6f7073]">
                A empresa ainda não publicou uma descrição.
              </p>
            )}
            <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {business.employee_count != null && (
                <Fact icon={Users}>
                  <strong>
                    {business.employee_count}{' '}
                    {business.employee_count === 1 ? 'pessoa' : 'pessoas'}
                  </strong>{' '}
                  na equipe
                </Fact>
              )}
              {languages.length > 0 && (
                <Fact icon={Languages}>
                  Atende em <strong>{languages.join(', ')}</strong>
                </Fact>
              )}
              {!isSoftware && (
                <Fact icon={Images}>
                  {cases.length ? (
                    <>
                      <strong>
                        {cases.length}{' '}
                        {cases.length === 1 ? 'projeto' : 'projetos'}
                      </strong>{' '}
                      no portfólio
                    </>
                  ) : (
                    'Nenhum projeto publicado'
                  )}
                </Fact>
              )}
              {business.works_remotely && (
                <Fact icon={Laptop}>
                  <strong>Atende remotamente</strong>
                </Fact>
              )}
              {business.founded_year && (
                <Fact icon={Flag}>
                  Fundada em <strong>{business.founded_year}</strong>
                </Fact>
              )}
              {memberSince && (
                <Fact icon={CalendarDays}>
                  Na Selletive desde <strong>{memberSince}</strong>
                </Fact>
              )}
              {business.business_awards.length > 0 && (
                <Fact icon={Trophy}>
                  <strong>
                    {business.business_awards.length}{' '}
                    {business.business_awards.length === 1
                      ? 'prêmio'
                      : 'prêmios'}
                  </strong>{' '}
                  {business.business_awards.length === 1
                    ? 'recebido'
                    : 'recebidos'}
                </Fact>
              )}
              {isSoftware && business.min_budget != null && (
                <Fact icon={Wallet}>
                  A partir de <strong>{formatBRL(business.min_budget)}</strong>
                </Fact>
              )}
            </ul>
          </div>
          <aside
            aria-label={`Ações para ${business.name}`}
            className="lg:sticky lg:top-[136px] lg:self-start"
          >
            <div id="profile-actions" className="space-y-3">
              <a
                href="#avaliacoes"
                className="flex flex-col items-center rounded-xl border border-[#dce5e1] bg-white p-6 text-center hover:border-[#7b8983]"
              >
                {ratingCount ? (
                  <>
                    <span className="text-[40px] leading-none font-semibold text-[#0f161e]">
                      {formatRating(ratingAverage)}
                      <span className="text-xl font-normal text-[#6f7073]">
                        /5
                      </span>
                    </span>
                    <Stars value={ratingAverage} size={20} className="mt-2" />
                    <span className="mt-1 text-sm text-[#00756a] underline">
                      {reviewCountLabel(ratingCount)}
                    </span>
                  </>
                ) : (
                  <>
                    <Stars value={0} size={20} />
                    <span className="mt-2 text-sm text-[#3d3e45]">
                      Ainda sem avaliações
                    </span>
                  </>
                )}
              </a>
              {canContact ? (
                <Link
                  href={`/projects/new?providers=${business.id}`}
                  className="flex min-h-12 items-center justify-center rounded-lg bg-[#004038] px-5 text-[15px] font-semibold text-white hover:bg-[#00544c] active:bg-[#00332d]"
                >
                  Solicitar proposta
                </Link>
              ) : (
                <p className="rounded-lg bg-[#f7f9f8] p-4 text-sm text-[#3d3e45]">
                  Esta empresa ainda não recebe pedidos pela Selletive.
                </p>
              )}
              {website && (
                <BusinessContactLink
                  businessId={business.id}
                  event="website"
                  data-test="business-contact-website-sidebar"
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#7b8983] bg-white px-5 text-[15px] font-semibold text-[#004038] hover:bg-[#f6fefb]"
                >
                  Visitar site
                  <ExternalLink aria-hidden="true" className="size-4" />
                  <span className="sr-only">(abre em nova aba)</span>
                </BusinessContactLink>
              )}
              {calendar && (
                <a
                  href={calendar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#7b8983] bg-white px-5 text-[15px] font-semibold text-[#004038] hover:bg-[#f6fefb]"
                >
                  Agendar uma conversa
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              )}
              {customCta && (
                <a
                  href={customCta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#7b8983] bg-white px-5 text-[15px] font-semibold text-[#004038] hover:bg-[#f6fefb]"
                >
                  {business.custom_cta_label}
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              )}
              <DirectorySaveButton variant="block" business={saved} />
              {business.tier === 'unclaimed' && (
                <div className="rounded-xl border border-[#dce5e1] bg-[#f6fefb] p-5">
                  <p className="font-semibold text-[#0f161e]">
                    Esta é sua empresa?
                  </p>
                  <p className="mt-1 text-sm text-[#3d3e45]">
                    Assuma o controle do perfil gratuitamente e mantenha as
                    informações atualizadas.
                  </p>
                  <Link
                    className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#1fbc88] px-4 text-sm font-semibold text-[#012620] hover:bg-[#1aaf7e]"
                    href={`/claim/${business.slug}`}
                  >
                    Reivindicar empresa
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </section>

        {isSoftware && (
          <ProfileSection
            id="software"
            title="Recursos e planos"
            subtitle={
              <>
                O que{' '}
                <strong className="text-[#0f161e]">{business.name}</strong>{' '}
                oferece
              </>
            }
          >
            <div className="grid gap-8 md:grid-cols-2">
              {business.features.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-[#0f161e]">
                    Recursos
                  </h3>
                  <ChipList items={business.features} />
                </div>
              )}
              {business.integrations.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-[#0f161e]">
                    Integrações
                  </h3>
                  <ChipList items={business.integrations} />
                </div>
              )}
            </div>
            <dl className="mt-8 grid gap-4 rounded-xl border border-[#dce5e1] p-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Modelo de preços', business.pricing_model],
                [
                  'A partir de',
                  business.min_budget != null
                    ? formatBRL(business.min_budget)
                    : null,
                ],
                [
                  'Planos',
                  [
                    business.free_plan && 'Plano grátis',
                    business.free_trial && 'Teste grátis',
                  ]
                    .filter(Boolean)
                    .join(' · ') || null,
                ],
                ['Implantação', business.deployment.join(', ') || null],
                ['Para empresas', business.buyer_sizes.join(', ') || null],
                [
                  'Suporte',
                  [
                    business.portuguese && 'Em português',
                    ...business.support_languages,
                  ]
                    .filter(Boolean)
                    .join(', ') || null,
                ],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-[#6f7073]">{label}</dt>
                  <dd className="mt-0.5 font-medium text-[#0f161e]">
                    {value ?? 'Não informado'}
                  </dd>
                </div>
              ))}
            </dl>
          </ProfileSection>
        )}

        {business.business_services.length > 0 && (
          <ProfileSection
            id="servicos"
            title="Serviços"
            subtitle={
              <>
                <strong className="text-[#0f161e]">
                  {business.business_services.length}{' '}
                  {business.business_services.length === 1
                    ? 'serviço oferecido'
                    : 'serviços oferecidos'}
                </strong>{' '}
                por {business.name}
              </>
            }
          >
            <ServicesTable
              services={business.business_services}
              businessId={business.id}
              canContact={canContact}
            />
            {canContact && (
              <QuoteStrip
                businessId={business.id}
                title="Precisa de algum desses serviços?"
                text={`Envie um briefing para ${business.name} e converse pela Selletive.`}
              />
            )}
          </ProfileSection>
        )}

        <div id="cases" aria-hidden="true" className="scroll-mt-[136px]" />
        <ProfileSection
          id="portfolio"
          title="Portfólio"
          subtitle={
            cases.length ? (
              <>
                <strong className="text-[#0f161e]">
                  {cases.length} {cases.length === 1 ? 'projeto' : 'projetos'}
                </strong>{' '}
                realizados por {business.name}
              </>
            ) : undefined
          }
        >
          {cases.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((item) => {
                const cover = premium ? item.images[0] : undefined;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-[#dce5e1] bg-white"
                  >
                    {cover ? (
                      <DirectoryImage
                        src={cover}
                        alt=""
                        width={400}
                        height={240}
                        className="aspect-[5/3] w-full object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex aspect-[5/3] items-center justify-center bg-[#dfe6f1]"
                      >
                        <Images className="size-8 text-[#6f7073]" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-semibold text-[#0f161e]">
                        {item.client_name
                          ? `${item.client_name}: ${item.title}`
                          : item.title}
                      </h3>
                      {(item.industry || item.project_type) && (
                        <p className="mt-1 text-sm text-[#3d3e45]">
                          {[
                            item.project_type,
                            item.industry && `Setor: ${item.industry}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                      <details className="group mt-3 text-sm text-[#3d3e45]">
                        <summary className="cursor-pointer list-none">
                          <span className="line-clamp-3 whitespace-pre-line group-open:line-clamp-none">
                            {item.description}
                          </span>
                          <span className="mt-2 inline-block font-semibold text-[#00756a] underline group-open:hidden">
                            Ler mais
                          </span>
                        </summary>
                        <dl className="mt-4 space-y-3">
                          {[
                            ['Desafio', item.challenge],
                            ['Solução', item.solution],
                            ['Resultados', item.results],
                            ['Duração', item.duration],
                            ['Orçamento', item.budget_range],
                          ]
                            .filter(([, value]) => value)
                            .map(([label, value]) => (
                              <div key={label}>
                                <dt className="font-semibold text-[#0f161e]">
                                  {label}
                                </dt>
                                <dd className="whitespace-pre-line">{value}</dd>
                              </div>
                            ))}
                        </dl>
                        {premium && item.images.length > 1 && (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {item.images.slice(1).map((url) => (
                              <DirectoryImage
                                key={url}
                                src={url}
                                alt={item.title}
                                width={300}
                                height={200}
                                className="h-28 w-full rounded-lg object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-[#dce5e1] bg-[#f7f9f8] p-6 text-sm text-[#3d3e45]">
              {business.name} ainda não publicou projetos.
            </p>
          )}
          {canContact && cases.length > 0 && (
            <QuoteStrip
              businessId={business.id}
              title="Tem um projeto parecido?"
              text={`Conte o que você precisa para ${business.name}.`}
            />
          )}
        </ProfileSection>

        {gallery.length > 0 && (
          <ProfileSection id="galeria" title="Galeria">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {gallery.map((item) => (
                <figure key={item.id}>
                  <DirectoryImage
                    src={item.image_url}
                    alt={item.caption || `Imagem de ${business.name}`}
                    width={600}
                    height={400}
                    className="aspect-[3/2] w-full rounded-xl object-cover"
                  />
                  {item.caption && (
                    <figcaption className="mt-2 text-sm text-[#3d3e45]">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
            {video && (
              <a
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#00756a] underline"
                href={video}
                target="_blank"
                rel="noopener noreferrer"
              >
                Assistir ao vídeo
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            )}
          </ProfileSection>
        )}
        {gallery.length === 0 && video && (
          <div className="border-t border-[#dce5e1] py-8">
            <a
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#00756a] underline"
              href={video}
              target="_blank"
              rel="noopener noreferrer"
            >
              Assistir ao vídeo
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </div>
        )}

        {hasTeam && (
          <ProfileSection
            id="equipe"
            title="Equipe"
            subtitle={
              business.employee_count != null ? (
                <>
                  <strong className="text-[#0f161e]">
                    {business.employee_count}{' '}
                    {business.employee_count === 1 ? 'pessoa' : 'pessoas'}
                  </strong>{' '}
                  na equipe de {business.name}
                </>
              ) : undefined
            }
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              <div>
                {business.team_story && (
                  <>
                    <h3 className="text-sm font-semibold text-[#0f161e]">
                      História
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-[#3d3e45]">
                      {business.team_story}
                    </p>
                  </>
                )}
                {business.clients.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-[#0f161e]">
                      Clientes
                    </h3>
                    <ChipList items={business.clients} />
                  </div>
                )}
                {business.sectors.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-[#0f161e]">
                      Setores atendidos
                    </h3>
                    <ChipList items={business.sectors} />
                  </div>
                )}
              </div>
              {business.team_photo_url && (
                <DirectoryImage
                  src={business.team_photo_url}
                  alt={`Equipe de ${business.name}`}
                  width={900}
                  height={500}
                  className="max-h-96 w-full rounded-xl object-cover"
                />
              )}
            </div>
          </ProfileSection>
        )}

        {business.business_awards.length > 0 && (
          <ProfileSection
            id="premios"
            title="Prêmios"
            subtitle={
              <>
                {business.name} recebeu{' '}
                <strong className="text-[#0f161e]">
                  {business.business_awards.length}{' '}
                  {business.business_awards.length === 1 ? 'prêmio' : 'prêmios'}
                </strong>
              </>
            }
          >
            <ul className="grid gap-4 md:grid-cols-2">
              {business.business_awards.map((award) => (
                <li
                  key={award.id}
                  className="flex gap-4 rounded-xl border border-[#dce5e1] p-5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f6fefb] text-[#004038]">
                    <Trophy aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#0f161e]">
                      {award.title}
                    </p>
                    <p className="text-sm text-[#6f7073]">
                      {award.issuer}
                      {award.year ? ` · ${award.year}` : ''}
                    </p>
                    {award.description && (
                      <p className="mt-2 text-sm text-[#3d3e45]">
                        {award.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </ProfileSection>
        )}

        <section
          id="avaliacoes"
          className="scroll-mt-[136px] border-t border-[#dce5e1] py-12 md:py-16"
        >
          <ReviewsSection
            businessId={business.id}
            businessName={business.name}
            reviews={business.reviews ?? []}
            kind={business.offering_kind}
            canReview={canContact}
            summary={{ average: ratingAverage, count: ratingCount }}
          />
        </section>

        <ProfileSection
          id="contato"
          title="Contato"
          subtitle={
            <>
              Informações de contato de{' '}
              <strong className="text-[#0f161e]">{business.name}</strong>
            </>
          }
        >
          <BusinessInfo
            business={{
              ...business,
              address_description:
                typeof address.description === 'string'
                  ? address.description
                  : null,
              social_links: socialLinks,
            }}
          />
        </ProfileSection>

        {products && products.length > 0 && (
          <ProfileSection id="produtos" title="Softwares deste fornecedor">
            <ul className="flex flex-wrap gap-3">
              {products.map((product) => (
                <li key={product.slug}>
                  <Link
                    className="inline-flex min-h-11 items-center rounded-lg border border-[#dce5e1] px-4 text-sm font-semibold text-[#004038] hover:border-[#00756a]"
                    href={`/company/${product.slug}`}
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </ProfileSection>
        )}
      </div>
      <ProfileStickyBar
        targetId="profile-actions"
        business={saved}
        canContact={canContact}
      />
    </div>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <BusinessProfilePage {...props} />
    </Suspense>
  );
}
