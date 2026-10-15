import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';
import { pageMetadata } from '~/lib/seo';

import { CategoryList } from './_components/category-list';

export function generateMetadata() {
  return pageMetadata(
    'Categorias de serviços B2B | Selletive',
    'Explore empresas por especialidade. Descubra parceiros de marketing, design, tecnologia e outros serviços para sua empresa.',
    '/categories',
  );
}

async function CategoriesPage() {
  const client = getSupabaseServerClient();

  const { data: categories } = await client
    .from('categories')
    .select('id, name, slug, description, icon')
    .eq('is_active', true)
    .order('name');

  return (
    <div className={'container mx-auto py-8'}>
      <h1 className={'mb-6 text-4xl font-bold'}>
        <Trans i18nKey={'categories:heading'} defaults={'Browse Categories'} />
      </h1>

      <CategoryList categories={categories ?? []} />
    </div>
  );
}

export default withI18n(CategoriesPage);
