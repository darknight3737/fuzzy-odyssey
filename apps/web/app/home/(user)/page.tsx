import Link from 'next/link';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { withI18n } from '~/lib/i18n/with-i18n';

export const metadata = {
  title: 'Minhas empresas | Selletive',
  robots: { index: false, follow: false },
};
async function UserHomePage() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: businesses, error } = user
    ? await client
        .from('businesses')
        .select('id,name,slug,tier,description')
        .eq('account_id', user.id)
        .order('name')
    : { data: [], error: null };
  if (error) throw error;
  return (
    <main className="mx-auto w-full max-w-5xl p-6 lg:p-10">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-muted-foreground mb-2 text-sm">
            Seu espaço na Selletive
          </p>
          <h1 className="font-serif text-4xl">Minhas empresas</h1>
        </div>
        <Link href="/claim" className="rounded-full border px-5 py-3 text-sm">
          Reivindicar uma empresa
        </Link>
      </div>
      {businesses?.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {businesses.map((b) => (
            <article key={b.id} className="rounded-2xl border p-7">
              <span className="text-muted-foreground text-xs uppercase tracking-widest">
                {b.tier}
              </span>
              <h2 className="mt-3 text-xl font-semibold">{b.name}</h2>
              <p className="text-muted-foreground mt-3 line-clamp-3 text-sm">
                {b.description}
              </p>
              <div className="mt-7 flex gap-5 text-sm">
                <Link
                  href={`/home/businesses/${b.slug}`}
                  className="font-medium underline"
                >
                  Gerenciar perfil
                </Link>
                <Link
                  href={`/company/${b.slug}`}
                  className="text-muted-foreground"
                >
                  Ver perfil ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-muted/20 rounded-2xl border px-8 py-16 text-center">
          <h2 className="font-serif text-2xl">Sua empresa começa aqui.</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md">
            Você ainda não gerencia um perfil. Encontre sua empresa e confirme
            seu e-mail corporativo para começar.
          </p>
          <Link
            href="/claim"
            className="bg-primary text-primary-foreground mt-7 inline-block rounded-full px-6 py-3"
          >
            Encontrar minha empresa
          </Link>
        </div>
      )}
    </main>
  );
}
export default withI18n(UserHomePage);
