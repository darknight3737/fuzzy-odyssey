import { Suspense } from 'react';

import { connection } from 'next/server';

import { Trans } from '@kit/ui/trans';

import { CompassPageLoader } from '~/components/compass-loader';
import { pageMetadata } from '~/lib/seo';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import { CategoryList } from './_components/category-list';

export function generateMetadata() {
  return pageMetadata(
    'Categorias de serviços e software B2B | Selletive',
    'Explore fornecedores de serviços e produtos de software por categoria.',
    '/categories',
  );
}

async function CategoriesPage() {
  await connection();
  const client = getDirectoryClient();

  const { data: categories } = await client
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('is_active', true)
    .order('name');

  return (
    <div className={'container mx-auto px-6 py-8'}>
      <h1 className={'mb-6 text-4xl font-bold'}>
        <Trans i18nKey={'categories.heading'} defaults={'Browse Categories'} />
      </h1>

      <CategoryList categories={categories ?? []} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <CategoriesPage />
    </Suspense>
  );
}
