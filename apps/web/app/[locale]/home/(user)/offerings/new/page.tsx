import { Suspense } from 'react';

import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Trans } from '@kit/ui/trans';

import type { Database } from '~/lib/database.types';

import { OfferingForm } from './_components/offering-form';
export const metadata = {
  title: 'Cadastrar serviço ou software B2B | Selletive',
  robots: { index: false, follow: false },
};
type SearchParams = Promise<{ name?: string; site?: string }>;

async function loadCategories(
  client: ReturnType<typeof getSupabaseServerClient<Database>>,
) {
  const query = () =>
    client
      .from('categories')
      .select('id,name,slug,parent_id,category_aliases(alias_name,alias_slug)')
      .eq('is_active', true)
      .order('name')
      .order('id');
  const categories = [];
  const batchSize = 250;

  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await query().range(offset, offset + batchSize - 1);
    if (error) throw error;

    categories.push(
      ...data.map(({ category_aliases, ...category }) => ({
        ...category,
        aliases: category_aliases.flatMap(({ alias_name, alias_slug }) => [
          alias_name,
          alias_slug,
        ]),
      })),
    );

    if (data.length < batchSize) return categories;
  }
}

async function FormContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const name = typeof params.name === 'string' ? params.name.slice(0, 160) : '';
  const site =
    typeof params.site === 'string' &&
    /^[a-z0-9.-]+$/i.test(params.site) &&
    params.site.length <= 253
      ? `https://${params.site}`
      : '';
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/auth/sign-in?next=/home/offerings/new');
  const [categories, vendors] = await Promise.all([
    loadCategories(client),
    client
      .from('businesses')
      .select('id,name')
      .eq('account_id', user.id)
      .eq('offering_kind', 'service')
      .order('name')
      .limit(100),
  ]);
  if (vendors.error) throw vendors.error;
  return (
    <OfferingForm
      initial={{ name, site }}
      categories={categories}
      emailDomain={
        user.email_confirmed_at
          ? (user.email?.split('@')[1]?.toLowerCase() ?? '')
          : ''
      }
      vendors={vendors.data ?? []}
    />
  );
}
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-primary mb-2 text-sm font-semibold">
        <Trans i18nKey="offering.freeProfile" />
      </p>
      <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
        <Trans i18nKey="offering.title" />
      </h1>
      <p className="text-muted-foreground mt-3 mb-8 max-w-xl">
        <Trans i18nKey="offering.intro" />
      </p>
      <Suspense
        fallback={
          <p role="status">
            <Trans i18nKey="offering.loading" />
          </p>
        }
      >
        <FormContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
