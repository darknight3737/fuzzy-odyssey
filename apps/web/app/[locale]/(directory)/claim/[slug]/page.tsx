import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ClaimButton } from './_components/claim-button';

export const metadata = {
  title: 'Reivindicar empresa | Selletive',
  robots: { index: false, follow: true },
};
async function ClaimBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const client = getSupabaseServerClient();
  const [
    { data: business, error },
    {
      data: { user },
    },
  ] = await Promise.all([
    client
      .from('businesses')
      .select('name,slug,website,tier')
      .eq('slug', slug)
      .maybeSingle(),
    client.auth.getUser(),
  ]);
  if (error) throw error;
  if (!business) notFound();
  return (
    <main className="container mx-auto max-w-2xl flex-1 px-6 py-20">
      <Link href={`/company/${slug}`} className="text-muted-foreground text-sm">
        ← Voltar ao perfil
      </Link>
      <h1 className="mt-8 font-serif text-4xl">Reivindicar {business.name}</h1>
      <p className="text-muted-foreground my-6 leading-relaxed">
        Para proteger a empresa, verificamos o e-mail confirmado da sua conta. O
        domínio precisa ser o mesmo do site cadastrado:{' '}
        <strong>{business.website || 'Site ainda não cadastrado'}</strong>.
      </p>
      {business.tier !== 'unclaimed' ? (
        <p className="rounded-xl border p-6">
          Este perfil já foi reivindicado.{' '}
          <Link href="/contact" className="underline">
            Precisa de ajuda?
          </Link>
        </p>
      ) : user ? (
        <div className="rounded-2xl border p-8">
          <p className="mb-5 text-sm">Conta atual: {user.email}</p>
          <ClaimButton slug={slug} />
          <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
            Ao reivindicar, você declara ter autorização para representar esta
            empresa. Informações de verificação e planos são gerenciadas pela
            plataforma.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/auth/sign-in?next=${encodeURIComponent(`/claim/${slug}`)}`}
            className="bg-primary text-primary-foreground rounded-full px-6 py-3"
          >
            Entrar com e-mail corporativo
          </Link>
          <Link
            href={`/auth/sign-up?next=${encodeURIComponent(`/claim/${slug}`)}`}
            className="rounded-full border px-6 py-3"
          >
            Criar conta
          </Link>
        </div>
      )}
      <p className="text-muted-foreground mt-8 text-sm">
        Não tem acesso ao domínio?{' '}
        <Link href="/contact" className="underline">
          Fale com nossa equipe para solicitar uma análise.
        </Link>
      </p>
    </main>
  );
}
export default function Page(props: Parameters<typeof ClaimBusinessPage>[0]) {
  return (
    <Suspense
      fallback={
        <div role="status" className="container mx-auto min-h-96 px-6 py-12">
          Carregando…
        </div>
      }
    >
      <ClaimBusinessPage {...props} />
    </Suspense>
  );
}
