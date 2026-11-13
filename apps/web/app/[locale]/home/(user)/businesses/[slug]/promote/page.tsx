import { Suspense } from 'react';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import { Check } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  AdminSection,
  buttonAccent,
  buttonPrimary,
  buttonSecondary,
} from '~/components/admin-ui';
import { CompassPageLoader } from '~/components/compass-loader';
import { LeadPotential } from '~/components/lead-potential';
import { MARKETPLACE_PLANS, tierRank } from '~/lib/plans';

import { BusinessDashboard } from '../_components/business-dashboard';

export const metadata = {
  title: 'Planos e visibilidade | Selletive',
  robots: { index: false, follow: false },
};

const faq = [
  [
    'O Destaque e o Spotlight exigem o selo no meu site?',
    'Não. O selo é obrigatório apenas para o Verificado gratuito. Nos planos pagos ele é opcional.',
  ],
  [
    'Como funciona a contratação?',
    'O pagamento online ainda está sendo configurado. Por enquanto, nossa equipe responde ao seu pedido e combina a ativação com você antes de qualquer cobrança.',
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
    .select(
      'id,name,slug,tier,website,verification_status,offering_kind,logo_url,description,features,business_categories(category_id),business_services(id),business_cases(id)',
    )
    .eq('slug', slug)
    .eq('account_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!b) notFound();
  const rank = tierRank(b.tier);
  return (
    <BusinessDashboard business={b} section="promote">
      <p id="verificacao" className="text-sm">
        Você pode escolher Destaque ou Spotlight sem verificar o perfil antes.{' '}
        <Link href={`/home/businesses/${slug}/selos`} className="underline">
          Ver selos
        </Link>
      </p>
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-[#dce5e1] bg-white p-4">
            <h3 className="font-semibold">Prévia do Destaque</h3>
            <p className="mt-2 font-medium">{b.name}</p>
            <p className="text-sm">
              {b.offering_kind === 'software'
                ? 'Vídeo de demonstração e botão de agendamento no perfil.'
                : 'Cases com imagens e botão de pedido de proposta no perfil.'}
            </p>
          </section>
          <section className="rounded-xl border border-[#dce5e1] bg-white p-4">
            <h3 className="font-semibold">Prévia do Spotlight</h3>
            <p className="mt-2 font-medium">
              {b.name} <span className="ml-1 text-xs">· Patrocinado</span>
            </p>
            <p className="text-sm">
              Exemplo de identificação nas buscas de segmentos compatíveis.
              Disponibilidade sob consulta.
            </p>
          </section>
        </div>
        <AdminSection
          id="planos"
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
                        href={`/home/businesses/${slug}/selos`}
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

        <AdminSection
          id="simulacao"
          title="Simule o potencial do seu perfil"
          description="Cenário ilustrativo, baseado nas suas hipóteses."
        >
          <LeadPotential />
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
    </BusinessDashboard>
  );
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <Promotion {...props} />
    </Suspense>
  );
}
