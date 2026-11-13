import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { CompassPageLoader } from '~/components/compass-loader';
import {
  DirectoryFilters,
  DirectoryPagination,
} from '~/components/directory-filters';
import { DirectoryResults } from '~/components/directory-results';
import { DirectoryHelpBand, DirectoryHero } from '~/components/directory-ui';
import {
  categoryLabel,
  isTranslatedCategory,
} from '~/lib/directory/category-label';
import {
  type DirectoryParams,
  directoryPage,
  filtersFromParams,
  searchMarketplace,
} from '~/lib/directory/marketplace';
import { getDirectoryOptions } from '~/lib/directory/options';
import { taxonomyKind } from '~/lib/directory/taxonomy';
import { pageMetadata } from '~/lib/seo';
import { socialImageUrl } from '~/lib/social-images';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import {
  DirectoryGuide,
  DirectoryIntro,
  DirectoryLinkColumns,
  DirectoryProjects,
} from './_components/category-sections';
import { getCategoryBySlug } from './_lib/server/get-category';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<DirectoryParams>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Categoria não encontrada' };
  const filters = await searchParams;
  const index =
    !Object.values(filters).some(Boolean) &&
    (await searchMarketplace({ category: slug, kind: taxonomyKind(slug) }))
      .total > 0;
  return pageMetadata(
    `${categoryLabel(category.slug, category.name)} — Compare empresas | Selletive`,
    (!isTranslatedCategory(category.slug) &&
      category.description?.slice(0, 160)) ||
      `Encontre empresas de ${categoryLabel(category.slug, category.name)} na Selletive.`,
    `/categories/${slug}`,
    index,
    socialImageUrl('category', category.slug, category.updated_at),
  );
}

async function Content({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const query = await searchParams;
  const kind = taxonomyKind(slug);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const page = directoryPage(query);
  const filters = { ...filtersFromParams(query), category: slug, kind };
  const [result, options, { data: locations }, { data: specialties }] =
    await Promise.all([
      searchMarketplace(filters, page),
      getDirectoryOptions(
        undefined,
        typeof query.location === 'string' ? query.location : undefined,
        false,
        true,
      ),
      getDirectoryClient()
        .from('directory_pages')
        .select('category_slug,location_slug,location_name,business_count')
        .eq('category_slug', slug)
        .order('business_count', { ascending: false })
        .limit(30),
      getDirectoryClient()
        .from('categories')
        .select('name,slug')
        .eq('parent_id', category.id)
        .eq('is_active', true)
        .order('name'),
    ]);
  const { data: cases } = result.items.length
    ? await getDirectoryClient()
        .from('business_cases')
        .select('id,title,description,business_id')
        .in(
          'business_id',
          result.items.map((item) => item.business.id),
        )
        .order('display_order')
        .limit(60)
    : { data: [] };
  const label = categoryLabel(category.slug, category.name);
  const complements: Record<string, { slug: string; label: string }> = {
    'crm-software': {
      slug: 'crm-consulting',
      label: 'Consultoria e implantação de CRM',
    },
    'erp-software': {
      slug: 'erp-consulting',
      label: 'Consultoria e implantação de ERP',
    },
    'crm-consulting': { slug: 'crm-software', label: 'Software CRM' },
    'erp-consulting': { slug: 'erp-software', label: 'Software ERP' },
  };
  const complement = complements[slug];
  const names = new Map(
    result.items.map((item) => [item.business.id, item.business]),
  );
  const caseLimits: Record<string, number> = {
    claimed: 1,
    verified: 3,
    highlight: 15,
    spotlight: 15,
  };
  const shown = new Map<string, number>();
  const visibleCases = (cases ?? [])
    .filter((item) => {
      const tier = names.get(item.business_id)?.tier ?? 'unclaimed';
      const count = shown.get(item.business_id) ?? 0;
      if (count >= (caseLimits[tier] ?? 0)) return false;
      shown.set(item.business_id, count + 1);
      return true;
    })
    .slice(0, 6);
  return (
    <main className="flex-1">
      <DirectoryHero
        title={`Empresas de ${label}`}
        subtitle="Qual é a ideal para a sua empresa? Compare projetos, avaliações e orçamentos."
      />
      <div className="mx-auto w-[min(100%-32px,1200px)] pb-20">
        <DirectoryFilters
          params={{ ...query, kind }}
          category={slug}
          options={options}
          total={result.total}
          breadcrumbs={[
            { label: 'Categorias', href: '/categories' },
            { label },
          ]}
          key={String(query.kind ?? '')}
        />
        {complement && (
          <p className="mt-4 text-sm">
            <Link
              className="text-primary underline"
              href={`/categories/${complement.slug}`}
            >
              Explore também · {complement.label}
            </Link>
          </p>
        )}
        <DirectoryIntro
          text={
            (category.description && !isTranslatedCategory(category.slug)
              ? category.description
              : null) ??
            `Compare empresas de ${label} que atendem o mercado brasileiro. Veja projetos publicados, avaliações e faixas de orçamento, salve até cinco opções e envie um único briefing para iniciar a conversa.`
          }
        />
        <DirectoryResults
          items={result.items}
          title={`Todas as empresas de ${label}`}
          featuredTitle={`Empresas de ${label} em destaque`}
          spotlight={page === 1 && (!query.sort || query.sort === 'relevance')}
        />
        <DirectoryPagination params={query} page={page} total={result.total} />
        <DirectoryHelpBand />
        {visibleCases.length > 0 && (
          <DirectoryProjects
            items={visibleCases.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              company: names.get(item.business_id) ?? null,
            }))}
          />
        )}
        <DirectoryLinkColumns
          columns={[
            {
              title: 'Especialidades relacionadas',
              links: (specialties ?? []).map((item) => ({
                href: `/categories/${item.slug}`,
                label: categoryLabel(item.slug, item.name),
              })),
            },
            {
              title: `${label} por localização`,
              links: (locations ?? []).map((item) => ({
                href: `/${item.category_slug}/${item.location_slug}`,
                label: `${item.location_name} (${item.business_count})`,
              })),
            },
          ]}
        />
        <DirectoryGuide label={label} />
      </div>
    </main>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <Content {...props} />
    </Suspense>
  );
}
