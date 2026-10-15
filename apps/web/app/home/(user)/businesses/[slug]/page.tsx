import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';


import { BusinessEditor } from './_components/business-editor';

export const metadata = {
  title: 'Gerenciar empresa | Selletive',
  robots: { index: false, follow: false },
};
async function ManageBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  const { data: b, error } = await client
    .from('businesses')
    .select(
      'slug,name,description,website,email,phone,logo_url,employee_count,founded_year,works_remotely',
    )
    .eq('slug', slug)
    .eq('account_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!b) notFound();
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
      <BusinessEditor
        values={{
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
    </main>
  );
}
export default ManageBusinessPage;
