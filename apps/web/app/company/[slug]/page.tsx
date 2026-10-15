import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { If } from '@kit/ui/if';

import appConfig from '~/config/app.config';
import { withI18n } from '~/lib/i18n/with-i18n';
import { pageMetadata, safeWebsite, serializeJsonLd } from '~/lib/seo';

import { BusinessHeader } from './_components/business-header';
import { BusinessInfo } from './_components/business-info';
import { BusinessServices } from './_components/business-services';
import { ReviewsSection } from './_components/reviews-section';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const client = getSupabaseServerClient();

  const { data: business, error } = await client
    .from('businesses')
    .select('name, description, logo_url')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!business) return { title: 'Business Not Found' };

  return pageMetadata(
    `${business.name} — Serviços e avaliações | Selletive`,
    business.description?.slice(0, 160) ||
      `Conheça ${business.name}, seus serviços e informações de contato na Selletive.`,
    `/company/${slug}`,
  );
}

async function BusinessProfilePage({ params }: Props) {
  const { slug } = await params;
  const client = getSupabaseServerClient();

  const { data: business, error } = await client
    .from('businesses')
    .select(
      `
      *,
      business_categories(categories(name, slug)),
      business_locations(locations(name, slug)),
      business_services(*),
      business_awards(*),
      business_cases(*),
      reviews(id, reviewer_name, rating, title, content, status, created_at)
    `,
    )
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!business) notFound();

  const showPremiumContent = ['highlight', 'spotlight'].includes(business.tier);

  return (
    <div className={'container mx-auto py-8'}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': `${appConfig.url}/company/${business.slug}#organization`,
            name: business.name,
            description: business.description || undefined,
            url: `${appConfig.url}/company/${business.slug}`,
            logo: safeWebsite(business.logo_url),
            sameAs: safeWebsite(business.website)
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
      <BusinessHeader business={business} />
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
      <BusinessInfo business={business} />

      <If
        condition={showPremiumContent && business.business_services?.length > 0}
      >
        <BusinessServices services={business.business_services} />
      </If>

      <ReviewsSection
        businessId={business.id}
        reviews={business.reviews ?? []}
      />
    </div>
  );
}

export default withI18n(BusinessProfilePage);
