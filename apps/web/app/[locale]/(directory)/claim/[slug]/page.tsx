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
    <main className="mx-auto w-[min(100%-32px,680px)] flex-1 py-12 md:py-20">
      <Link
        href={`/company/${slug}`}
        className="text-sm font-medium text-[#00756a] hover:underline"
      >
        ← Voltar ao perfil
      </Link>
      <h1 className="mt-8 text-[30px] leading-[1.15] font-semibold tracking-[-0.5px] [overflow-wrap:anywhere] text-[#0f161e] md:text-[40px]">
        Reivindicar {business.name}
      </h1>
      <ol className="my-8 grid gap-3 sm:grid-cols-3">
        {[
          'Entre com seu e-mail corporativo',
          'Confirmamos o domínio do site',
          'Você passa a gerenciar o perfil',
        ].map((step, index) => (
          <li
            key={step}
            className="rounded-xl border border-[#dce5e1] bg-white p-4 text-sm text-[#3d3e45]"
          >
            <span className="mb-2 flex size-7 items-center justify-center rounded-full bg-[#f6fefb] text-[13px] font-semibold text-[#004038]">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="my-6 leading-relaxed text-[#3d3e45]">
        Para proteger a empresa, verificamos o e-mail confirmado da sua conta. O
        domínio precisa ser o mesmo do site cadastrado:{' '}
        <strong>{business.website || 'Site ainda não cadastrado'}</strong>.
      </p>
      {business.tier !== 'unclaimed' ? (
        <p className="rounded-xl border border-[#dce5e1] bg-[#f7f9f8] p-6">
          Este perfil já foi reivindicado.{' '}
          <Link href="/contact" className="underline">
            Precisa de ajuda?
          </Link>
        </p>
      ) : user ? (
        <div className="rounded-2xl border border-[#dce5e1] bg-white p-6 md:p-8">
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
            className="inline-flex min-h-12 items-center rounded-lg bg-[#004038] px-6 text-[15px] font-semibold text-white hover:bg-[#00544c]"
          >
            Entrar com e-mail corporativo
          </Link>
          <Link
            href={`/auth/sign-up?next=${encodeURIComponent(`/claim/${slug}`)}`}
            className="inline-flex min-h-12 items-center rounded-lg border border-[#7b8983] bg-white px-6 text-[15px] font-semibold text-[#004038] hover:bg-[#f6fefb]"
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
