import { Suspense } from 'react';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import { Check } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  AdminHeader,
  AdminSection,
  TierBadge,
  buttonAccent,
  buttonPrimary,
  buttonSecondary,
} from '~/components/admin-ui';
import { LeadPotential } from '~/components/lead-potential';
import appConfig from '~/config/app.config';
import { MARKETPLACE_PLANS, tierRank } from '~/lib/plans';

import { BadgeVerification } from './_components/badge-verification';

export const metadata = {
  title: 'Planos e verificação | Selletive',
  robots: { index: false, follow: false },
};

const faq = [
  [
    'O Destaque e o Spotlight exigem o selo no meu site?',
    'Não. O selo é obrigatório apenas para o Verificado gratuito. Nos planos pagos ele é opcional.',
  ],
  [
    'Existe fidelidade?',
    'Não. Os planos pagos são mensais e podem ser cancelados quando você quiser.',
  ],
  [
    'Pagar melhora minhas avaliações?',
    'Não. Planos compram apresentação, ferramentas e exposição. Avaliações vêm apenas de clientes reais.',
  ],
  [
    'Os números da simulação são garantidos?',
    'Não. A simulação usa as hipóteses que você escolhe. O volume real depende da audiência da categoria e da sua oferta.',
  ],
];

async function Promotion({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  const { data: b, error } = await client
    .from('businesses')
    .select('id,name,slug,tier,website,verification_status')
    .eq('slug', slug)
    .eq('account_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!b) notFound();
  const rank = tierRank(b.tier);
  const verified =
    b.verification_status === 'verified' || b.tier === 'verified';
  const premium = rank >= 3;
  return (
    <>
      <AdminHeader
        back={{ href: `/home/businesses/${slug}`, label: 'Gerenciar perfil' }}
        eyebrow={b.name}
        title="Planos e verificação"
        description={
          <div className="flex flex-wrap items-center gap-3">
            <span>Seu plano atual:</span>
            <TierBadge tier={b.tier} />
          </div>
        }
      />
      <div className="space-y-6">
        <AdminSection
          id="verificacao"
          step={1}
          title={
            premium && !verified
              ? 'Selo da Selletive (opcional no seu plano)'
              : 'Verifique seu perfil gratuitamente'
          }
          description={
            premium && !verified
              ? 'Seu plano já inclui contatos e avaliações. Publicar o selo é opcional e ajuda visitantes do seu site a encontrar seu perfil.'
              : 'Com o Verificado, sua empresa passa a receber contatos e avaliações de clientes e ganha mais visibilidade nas buscas.'
          }
          status={{
            done: verified || premium,
            label: verified ? 'Concluído' : premium ? 'Opcional' : 'Pendente',
          }}
        >
          <BadgeVerification
            business={b}
            siteUrl={appConfig.url}
            verified={verified}
          />
        </AdminSection>

        <AdminSection
          id="simulacao"
          step={2}
          title="Simule o potencial do seu perfil"
          description="Cenário ilustrativo: ajuste as hipóteses e veja como exposição pode virar pedidos de orçamento."
        >
          <LeadPotential />
        </AdminSection>

        <AdminSection
          id="planos"
          step={3}
          title="Escolha seu plano"
          description="Destaque e Spotlight transformam seu perfil em um canal de novas oportunidades."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {MARKETPLACE_PLANS.map((plan) => {
              const planRank = tierRank(plan.id);
              const current = plan.id === b.tier;
              const featured = plan.id === 'highlight';
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-xl border p-6 ${featured ? 'border-[#004038] bg-[#004038] text-white' : 'border-[#dce5e1] bg-white'} ${current ? 'ring-2 ring-[#1fbc88] ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-lg font-semibold ${featured ? 'text-white' : 'text-[#0f161e]'}`}
                    >
                      {plan.name}
                    </h3>
                    {current && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${featured ? 'bg-[#1fbc88] text-[#012620]' : 'bg-[#f6fefb] text-[#004038]'}`}
                      >
                        Seu plano
                      </span>
                    )}
                  </div>
                  <p className="mt-3">
                    <span className="text-[32px] leading-none font-semibold">
                      {plan.price === 0
                        ? 'R$ 0'
                        : `${plan.id === 'spotlight' ? 'a partir de ' : ''}R$ ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span
                        className={
                          featured ? 'text-[#c4ded4]' : 'text-[#6f7073]'
                        }
                      >
                        /mês
                      </span>
                    )}
                  </p>
                  <p
                    className={`mt-2 text-sm ${featured ? 'text-[#c4ded4]' : 'text-[#3d3e45]'}`}
                  >
                    {plan.description}
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <Check
                          aria-hidden="true"
                          className={`mt-0.5 size-4 shrink-0 ${featured ? 'text-[#7edcaf]' : 'text-[#00756a]'}`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    {current || planRank < rank ? (
                      <p
                        className={`text-sm ${featured ? 'text-[#c4ded4]' : 'text-[#6f7073]'}`}
                      >
                        {current ? 'Plano ativo' : 'Incluído no seu plano'}
                      </p>
                    ) : plan.id === 'claimed' ? null : plan.id ===
                      'verified' ? (
                      <a
                        href="#verificacao"
                        className={`${buttonSecondary} w-full`}
                      >
                        Verificar grátis
                      </a>
                    ) : (
                      <Link
                        className={`${featured ? buttonAccent : buttonPrimary} w-full`}
                        href={
                          '/contact?subject=' +
                          encodeURIComponent(
                            `Quero assinar o ${plan.name} — ${b.name}`,
                          )
                        }
                      >
                        Quero o {plan.name}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[13px] text-[#6f7073]">
            O pagamento online ainda está sendo configurado. Ao pedir um plano,
            nossa equipe entra em contato para ativá-lo. Nenhuma cobrança é
            feita agora.
          </p>
        </AdminSection>

        <section
          aria-labelledby="faq-title"
          className="rounded-2xl border border-[#dce5e1] bg-white p-6 md:p-8"
        >
          <h2 id="faq-title" className="text-lg font-semibold text-[#0f161e]">
            Perguntas frequentes
          </h2>
          <div className="mt-4 divide-y divide-[#dce5e1]">
            {faq.map(([question, answer]) => (
              <details key={question} className="group py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-medium text-[#0f161e]">
                  {question}
                  <span
                    aria-hidden="true"
                    className="text-[#6f7073] transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-4 text-sm text-[#3d3e45]">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 lg:py-10">
      <Suspense fallback={<p>Carregando planos…</p>}>
        <Promotion {...props} />
      </Suspense>
    </main>
  );
}
