import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { CategoryList } from './_components/category-list';

export async function generateMetadata() {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('categories:pageTitle'),
    description: i18n.t('categories:pageDescription'),
  };
}

async function CategoriesPage() {
  const client = getSupabaseServerClient();

  const { data: categories } = await client
    .from('categories')
    .select('id, name, slug, description, icon')
    .eq('level', 1)
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

