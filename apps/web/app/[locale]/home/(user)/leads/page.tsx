import { Suspense } from 'react';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  AdminHeader,
  buttonPrimary,
  buttonSecondary,
} from '~/components/admin-ui';
import { CompassPageLoader } from '~/components/compass-loader';
export const metadata = {
  title: 'Pedidos e oportunidades | Selletive',
  robots: { index: false, follow: false },
};
async function Inbox() {
  await connection();
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  const { data: briefs, error } = await client
    .from('lead_briefs')
    .select(
      'id,title,description,buyer_user_id,offering_kind,status,created_at',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const status = (value: string) =>
    value === 'open' ? (
      <span className="inline-flex h-7 items-center rounded-full bg-[#eaf8f1] px-3 text-[13px] font-medium text-[#00665b]">
        Aberto
      </span>
    ) : (
      <span className="inline-flex h-7 items-center rounded-full bg-[#f7f9f8] px-3 text-[13px] font-medium text-[#333e49]">
        Encerrado
      </span>
    );
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/projects/new" className={buttonPrimary}>
          Novo pedido
        </Link>
        <Link href="/api/leads/export" className={buttonSecondary}>
          Exportar meus contatos (CSV)
        </Link>
      </div>
      {!briefs?.length ? (
        <div className="rounded-2xl border border-[#dce5e1] bg-white p-8">
          <p className="font-semibold text-[#0f161e]">
            Nenhum pedido por enquanto
          </p>
          <p className="mt-2 max-w-[620px] text-sm text-[#3d3e45]">
            Aqui aparecem os pedidos que você enviou e as oportunidades que suas
            empresas receberam. Para receber novos contatos, ative o Verificado
            (grátis), o Destaque ou o Spotlight no perfil da empresa.
          </p>
          <Link href="/home" className={`${buttonSecondary} mt-6`}>
            Ir para minhas empresas
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[#dce5e1] rounded-2xl border border-[#dce5e1] bg-white">
          {briefs.map((b) => (
            <li key={b.id}>
              <Link
                href={'/home/leads/' + b.id}
                className="block p-6 transition-colors hover:bg-[#f7f9f8]"
              >
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="inline-flex h-7 items-center rounded-full bg-[#f6fefb] px-3 font-medium text-[#004038]">
                    {b.buyer_user_id === user.id
                      ? 'Meu pedido'
                      : 'Oportunidade recebida'}
                  </span>
                  {status(b.status)}
                  <span className="inline-flex h-7 items-center rounded-full bg-[#f7f9f8] px-3 font-medium text-[#333e49]">
                    {b.offering_kind === 'software' ? 'Software' : 'Serviço'}
                  </span>
                  <span className="ml-auto text-[#6f7073]">
                    {new Date(b.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-[#0f161e]">
                  {b.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-[#3d3e45]">
                  {b.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 lg:py-10">
      <AdminHeader
        eyebrow="Seu espaço na Selletive"
        title="Pedidos e oportunidades"
        description="Acompanhe seus pedidos e converse com empresas em um só lugar."
      />
      <Suspense fallback={<CompassPageLoader />}>
        <Inbox />
      </Suspense>
    </main>
  );
}
