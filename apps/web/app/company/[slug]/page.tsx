import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { If } from '@kit/ui/if';

import { withI18n } from '~/lib/i18n/with-i18n';

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

  const { data: business } = await client
    .from('businesses')
    .select('name, description, logo_url')
    .eq('slug', slug)
    .single();

  if (!business) return { title: 'Business Not Found' };

  return {
    title: `${business.name} - Selletive`,
    description: business.description,
    openGraph: {
      images: business.logo_url ? [business.logo_url] : [],
    },
  };
}

async function BusinessProfilePage({ params }: Props) {
  const { slug } = await params;
  const client = getSupabaseServerClient();

  const { data: business } = await client
    .from('businesses')
    .select(
      `
      *,
      business_categories(categories(name, slug)),
      business_locations(locations(name, slug)),
      business_services(*),
      business_awards(*),
      business_cases(*),
      reviews(*)
    `,
    )
    .eq('slug', slug)
    .single();

  if (!business) notFound();

  const showPremiumContent = ['highlight', 'spotlight'].includes(
    business.tier,
  );

  return (
    <div className={'container mx-auto py-8'}>
      <BusinessHeader business={business} />
      <BusinessInfo business={business} />

      <If
        condition={
          showPremiumContent && business.business_services?.length > 0
        }
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

