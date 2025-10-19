import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';

import { SearchResultsList } from './_components/search-results-list';

type Props = {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q || 'businesses';

  return {
    title: `Search: ${query} - Selletive`,
    description: `Search results for ${query}`,
  };
}

async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const client = getSupabaseServerClient();

  let query = client
    .from('businesses')
    .select(
      `
      id,
      name,
      slug,
      description,
      logo_url,
      tier,
      business_categories(categories(name, slug)),
      business_locations(locations(name))
    `,
    )
    .in('tier', ['verified', 'highlight', 'spotlight']);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }

  const { data: businesses } = await query
    .order('tier', { ascending: false })
    .limit(50);

  return (
    <div className={'container mx-auto py-8'}>
      <h1 className={'mb-6 text-4xl font-bold'}>
        <Trans
          i18nKey={'search:heading'}
          values={{ query: params.q }}
          defaults={`Search Results${params.q ? ` for "${params.q}"` : ''}`}
        />
      </h1>

      <SearchResultsList businesses={businesses ?? []} />
    </div>
  );
}

export default withI18n(SearchPage);

