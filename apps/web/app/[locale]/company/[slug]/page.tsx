import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import appConfig from '~/config/app.config';
import { DirectorySaveButton } from '~/components/directory-shortlist';
import { DirectoryImage } from '~/components/directory-image';
import { pageMetadata, safeWebsite, serializeJsonLd } from '~/lib/seo';
import { socialImageUrl } from '~/lib/social-images';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import { BusinessHeader } from './_components/business-header';
import { BusinessInfo } from './_components/business-info';
import { BusinessView } from './_components/business-interest';
import { BusinessServices } from './_components/business-services';
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

  const caseLimit = business.tier === 'claimed' ? 1 : business.tier === 'verified' ? 3 : ['highlight', 'spotlight'].includes(business.tier) ? 15 : 0;
  const socials = business.social_links && typeof business.social_links === 'object' && !Array.isArray(business.social_links) ? business.social_links : {};
  const address = business.address && typeof business.address === 'object' && !Array.isArray(business.address) ? business.address : {};
  const { data: products } = await client.from('businesses').select('name,slug').eq('vendor_business_id', business.id).eq('offering_kind', 'software').limit(24);
  const { data: vendor } = business.vendor_business_id ? await client.from('businesses').select('name,slug').eq('id', business.vendor_business_id).maybeSingle() : { data: null };
  const cases = (business.business_cases ?? []).slice(0, caseLimit);

  return (
    <div className={'container mx-auto py-8'}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': business.offering_kind === 'software' ? 'SoftwareApplication' : 'Organization',
            ...(business.offering_kind === 'software' ? { applicationCategory: 'BusinessApplication', operatingSystem: 'Web' } : {}),
            '@id': `${appConfig.url}/company/${business.slug}#organization`,
            name: business.name,
            description: business.description || undefined,
            url: `${appConfig.url}/company/${business.slug}`,
            logo: safeWebsite(business.logo_url),
            sameAs: ['verified','highlight','spotlight'].includes(business.tier) && safeWebsite(business.website)
              ? [safeWebsite(business.website)]
              : undefined,
          }),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-8 text-sm"
      >
        <Link href="/">Início</Link> / <Link href="/categories">Empresas</Link>{' '}
        / {business.name}
      </nav>
      <BusinessView businessId={business.id} />
      <BusinessHeader business={business} />
      {vendor && <p className="mb-4 text-sm">Produto de <Link className="underline" href={`/company/${vendor.slug}`}>{vendor.name}</Link></p>}
      <div className="mb-6"><DirectorySaveButton business={{ id: business.id, name: business.name, slug: business.slug, kind: business.offering_kind }} /></div>
      {business.tier === 'unclaimed' && (
        <div className="bg-muted/30 mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
          <p className="text-sm">
            Esta é sua empresa? Assuma o controle do perfil gratuitamente.
          </p>
          <Link
            className="bg-primary text-primary-foreground rounded-full px-5 py-3 text-sm"
            href={`/claim/${business.slug}`}
          >
            Reivindicar empresa
          </Link>
        </div>
      )}
      <nav aria-label="Navegação do perfil" className="bg-background sticky top-0 z-10 mb-8 flex gap-6 overflow-x-auto border-y py-4 text-sm">
        <a href="#sobre">Sobre</a><a href="#servicos">Serviços</a><a href="#cases">Cases</a><a href="#avaliacoes">Avaliações</a>
      </nav>
      {business.offering_kind === 'software' && <section className="mb-8 rounded-xl border p-6"><h2 className="text-xl font-bold">Sobre o software</h2>{business.features.length > 0 && <p className="mt-3"><strong>Recursos:</strong> {business.features.join(', ')}</p>}{business.integrations.length > 0 && <p className="mt-3"><strong>Integrações:</strong> {business.integrations.join(', ')}</p>}<p className="mt-3">{[business.free_trial && 'Teste grátis', business.free_plan && 'Plano grátis', business.portuguese && 'Disponível em português'].filter(Boolean).join(' · ')}</p>{business.pricing_model && <p className="mt-3"><strong>Preços:</strong> {business.pricing_model}</p>}{business.deployment.length > 0 && <p className="mt-3"><strong>Implantação:</strong> {business.deployment.join(', ')}</p>}{business.support_languages.length > 0 && <p className="mt-3"><strong>Suporte:</strong> {business.support_languages.join(', ')}</p>}{business.buyer_sizes.length > 0 && <p className="mt-3"><strong>Para empresas:</strong> {business.buyer_sizes.join(', ')}</p>}{business.min_budget != null && <p className="mt-3">A partir de R$ {business.min_budget.toLocaleString('pt-BR')}</p>}</section>}
      {(business.team_story || business.team_photo_url || business.clients.length > 0 || business.sectors.length > 0) && <section className="mb-8 rounded-xl border p-6"><h2 className="text-xl font-bold">Equipe e experiência</h2>{business.team_photo_url && <DirectoryImage src={business.team_photo_url} alt={`Equipe de ${business.name}`} width={900} height={500} className="mt-4 max-h-96 w-full rounded-lg object-cover" />}{business.team_story && <p className="mt-4 whitespace-pre-line">{business.team_story}</p>}{business.clients.length > 0 && <p className="mt-4"><strong>Clientes:</strong> {business.clients.join(', ')}</p>}{business.sectors.length > 0 && <p className="mt-4"><strong>Setores:</strong> {business.sectors.join(', ')}</p>}</section>}
      {['highlight','spotlight'].includes(business.tier) && business.business_gallery.length > 0 && <section className="mb-8"><h2 className="mb-4 text-2xl font-bold">Galeria</h2><div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{business.business_gallery.slice(0,20).map((item) => <figure key={item.id}><DirectoryImage src={item.image_url} alt={item.caption || `Imagem de ${business.name}`} width={600} height={400} className="h-52 w-full rounded-lg object-cover" />{item.caption && <figcaption className="mt-2 text-sm">{item.caption}</figcaption>}</figure>)}</div></section>}
      {['highlight','spotlight'].includes(business.tier) && (safeWebsite(business.video_url) || safeWebsite(business.calendar_url)) && <section className="mb-8 flex gap-4">{safeWebsite(business.video_url) && <a className="underline" href={safeWebsite(business.video_url)} target="_blank" rel="noopener noreferrer">Assistir ao vídeo</a>}{safeWebsite(business.calendar_url) && <a className="underline" href={safeWebsite(business.calendar_url)} target="_blank" rel="noopener noreferrer">Agendar uma conversa</a>}</section>}
      {(typeof address.description === 'string' || safeWebsite(typeof socials.linkedin === 'string' ? socials.linkedin : '') || safeWebsite(typeof socials.instagram === 'string' ? socials.instagram : '')) && <section className="mb-8 rounded-xl border p-6"><h2 className="text-xl font-bold">Localização e redes</h2>{typeof address.description === 'string' && <p className="mt-3">{address.description}</p>}<div className="mt-3 flex gap-4">{['verified','highlight','spotlight'].includes(business.tier) && typeof socials.linkedin === 'string' && safeWebsite(socials.linkedin) && <a className="underline" href={safeWebsite(socials.linkedin)} target="_blank" rel="noopener noreferrer">LinkedIn</a>}{['verified','highlight','spotlight'].includes(business.tier) && typeof socials.instagram === 'string' && safeWebsite(socials.instagram) && <a className="underline" href={safeWebsite(socials.instagram)} target="_blank" rel="noopener noreferrer">Instagram</a>}</div></section>}
      {products && products.length > 0 && <section className="mb-8 rounded-xl border p-6"><h2 className="text-xl font-bold">Softwares deste fornecedor</h2><ul className="mt-3 space-y-2">{products.map((product) => <li key={product.slug}><Link className="underline" href={`/company/${product.slug}`}>{product.name}</Link></li>)}</ul></section>}
      {['highlight','spotlight'].includes(business.tier) && safeWebsite(business.custom_cta_url) && business.custom_cta_label && <a className="mb-8 inline-block rounded-full border px-5 py-3" href={safeWebsite(business.custom_cta_url)} target="_blank" rel="noopener noreferrer">{business.custom_cta_label}</a>}
      <section id="sobre" className="scroll-mt-20"><BusinessInfo business={business} /></section>

      <section id="servicos" className="scroll-mt-20">
        {business.business_services?.length > 0 && <BusinessServices services={business.business_services} />}
      </section>
      <section id="cases" className="mb-8 scroll-mt-20"><h2 className="mb-4 text-2xl font-bold">Cases</h2><div className="grid gap-4 md:grid-cols-2">{cases.map((item) => <details key={item.id} className="rounded-xl border p-6"><summary className="cursor-pointer font-semibold">{item.title}{item.client_name && ` · ${item.client_name}`}</summary><p className="mt-4 whitespace-pre-line">{item.description}</p>{item.challenge && <p className="mt-3"><strong>Desafio:</strong> {item.challenge}</p>}{item.solution && <p className="mt-3"><strong>Solução:</strong> {item.solution}</p>}{item.results && <p className="mt-3"><strong>Resultados:</strong> {item.results}</p>}{item.industry && <p className="mt-3"><strong>Setor:</strong> {item.industry}</p>}{item.duration && <p className="mt-3"><strong>Duração:</strong> {item.duration}</p>}{['highlight','spotlight'].includes(business.tier) && item.images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3">{item.images.map((url) => <DirectoryImage key={url} src={url} alt={item.title} width={500} height={350} className="h-40 w-full rounded-lg object-cover" />)}</div>}</details>)}</div>{cases.length === 0 && <p className="text-muted-foreground text-sm">Ainda não há cases publicados.</p>}</section>
      {business.business_awards?.length > 0 && <section className="mb-8"><h2 className="mb-4 text-2xl font-bold">Prêmios</h2><ul className="grid gap-3 md:grid-cols-2">{business.business_awards.map((award) => <li key={award.id} className="rounded-xl border p-5"><strong>{award.title}</strong><p className="text-muted-foreground text-sm">{award.issuer}{award.year ? ` · ${award.year}` : ''}</p>{award.description && <p className="mt-2 text-sm">{award.description}</p>}</li>)}</ul></section>}
      <section id="avaliacoes" className="scroll-mt-20"><ReviewsSection businessId={business.id} reviews={business.reviews ?? []} kind={business.offering_kind} canReview={['verified', 'highlight', 'spotlight'].includes(business.tier)} /></section>
      {['verified', 'highlight', 'spotlight'].includes(business.tier) && <div className="bg-background sticky bottom-0 z-10 flex justify-end border-t py-4"><Link className="bg-primary text-primary-foreground rounded-full px-6 py-3 text-sm" href={`/projects/new?providers=${business.id}`}>Solicitar proposta</Link></div>}
    </div>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <div role="status" className="container mx-auto min-h-96 px-6 py-12">
          Carregando…
        </div>
      }
    >
      <BusinessProfilePage {...props} />
    </Suspense>
  );
}
