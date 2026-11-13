import { Suspense } from 'react';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ onboarding?: string }>;
}) {
  await connection();
  const [{ slug }, { onboarding }] = await Promise.all([params, searchParams]);
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
  const address =
    b.address && typeof b.address === 'object' && !Array.isArray(b.address)
      ? b.address
      : {};
  return (
    <main className="mx-auto w-full max-w-3xl p-6 lg:p-10">
      <Link href="/home" className="text-muted-foreground text-sm">
        ← Minhas empresas
      </Link>
      <div className="my-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">{b.name}</h1>
        <Link href={`/company/${slug}`} className="text-sm underline">
          Ver perfil público ↗
        </Link>
      </div>
      <div className="mb-6 flex gap-4 text-sm">
        <Link href={`/home/businesses/${slug}/promote`} className="underline">
          Planos e verificação
        </Link>
        <Link href="/home/leads" className="underline">
          Solicitações recebidas
        </Link>
      </div>
      {(onboarding === 'published' || onboarding === 'claimed') &&
        b.tier === 'claimed' && (
          <section
            aria-label="Próximo passo"
            className="bg-muted/50 mb-8 space-y-3 rounded-xl border p-5"
          >
            <h2 className="text-lg font-semibold">
              {onboarding === 'published'
                ? 'Seu perfil está no ar'
                : 'Agora você gerencia este perfil'}
            </h2>
            <p>
              {onboarding === 'published'
                ? 'Confira a página que os compradores veem e compartilhe o link.'
                : 'Revise a categoria e os dados de contato abaixo. A página já está visível no diretório.'}
            </p>
            <p className="text-muted-foreground text-sm">
              Para receber pedidos pela Selletive, o perfil precisa ser
              verificado.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/company/${slug}`}
                className="text-primary font-medium underline"
              >
                {onboarding === 'published'
                  ? 'Abrir página publicada'
                  : 'Conferir página pública'}
              </Link>
              <Link
                href={`/home/businesses/${slug}/promote`}
                className="text-sm underline"
              >
                Como verificar a empresa
              </Link>
            </div>
          </section>
        )}
      <BusinessAnalytics client={client} businessId={b.id} tier={b.tier} />
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
      <DetailsEditor
        vendors={vendors ?? []}
        paid={['highlight', 'spotlight'].includes(b.tier)}
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
            typeof socials.instagram === 'string' ? socials.instagram : '',
          address_text:
            typeof address.description === 'string' ? address.description : '',
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
      {['verified', 'highlight', 'spotlight'].includes(b.tier) && (
        <section className="my-8">
          <h2 className="mb-4 text-xl font-semibold">Responder avaliações</h2>
          {b.reviews
            .filter((review) => review.status === 'approved')
            .map((review) => {
              const response = review.review_responses.find(
                (item) => item.status === 'active',
              );
              return (
                <article key={review.id} className="mb-4 rounded-xl border p-5">
                  <strong>{review.title}</strong>
                  <p className="mt-2 text-sm">{review.content}</p>
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
        </section>
      )}
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
      {['highlight', 'spotlight'].includes(b.tier) && (
        <GalleryEditor
          businessId={b.id}
          slug={b.slug}
          items={b.business_gallery}
        />
      )}
      <ContentEditor
        businessId={b.id}
        slug={b.slug}
        kind="service"
        items={b.business_services.map((item) => ({
          ...item,
          detail: item.price_range ?? '',
        }))}
      />
      <ContentEditor
        businessId={b.id}
        slug={b.slug}
        kind="case"
        paid={['highlight', 'spotlight'].includes(b.tier)}
        items={b.business_cases.map((item) => ({
          ...item,
          detail: item.client_name ?? '',
        }))}
      />
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
