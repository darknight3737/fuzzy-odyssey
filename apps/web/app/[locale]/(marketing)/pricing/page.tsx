import Link from 'next/link';

import { MARKETPLACE_PLANS } from '~/lib/plans';
import { pageMetadata, serializeJsonLd } from '~/lib/seo';
export const metadata = pageMetadata(
  'Planos para empresas e softwares B2B | Selletive',
  'Conheça Grátis, Verificado, Destaque e Spotlight. Apresente sua solução e encontre novas oportunidades B2B.',
  '/pricing',
);
const faqs = [
  [
    'Preciso colocar o selo no meu site?',
    'Somente para ativar o Verificado gratuito. Nos planos Destaque e Spotlight o link é opcional.',
  ],
  [
    'O plano garante contatos?',
    'Não. Os planos oferecem recursos e vantagem de exposição em buscas compatíveis. Contatos dependem da audiência, procura e atratividade da oferta.',
  ],
  [
    'O plano altera minha nota?',
    'Não. Avaliações publicadas e notas não podem ser compradas. Filtros e a ordenação escolhida pelo visitante são respeitados.',
  ],
  [
    'O plano vale para todos os meus produtos?',
    'Cada assinatura promove um perfil de serviço ou um produto. Outros perfis podem continuar gratuitos.',
  ],
  [
    'Como funciona a cobrança?',
    'A ativação de cobrança está em preparação. Nenhum valor será cobrado nesta etapa. Os preços mensais de lançamento propostos são R$ 99 e Spotlight a partir de R$ 299.',
  ],
];
export default function PricingPage() {
  return (
    <main className="container mx-auto px-5 py-14">
      <p className="text-muted-foreground text-sm">
        Para empresas de serviços e software
      </p>
      <h1 className="my-4 text-4xl font-semibold md:text-5xl">
        Sua próxima oportunidade começa com um bom perfil.
      </h1>
      <p className="mb-10 max-w-2xl text-lg">
        Escolha como apresentar sua solução e ampliar sua exposição entre
        compradores B2B.
      </p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {MARKETPLACE_PLANS.map((p) => (
          <section
            key={p.id}
            id={p.id}
            style={{ scrollMarginTop: 88 }}
            className={
              'flex flex-col rounded-2xl border p-6 ' +
              (p.id === 'highlight' ? 'border-primary bg-muted/30' : '')
            }
          >
            <h2 className="text-2xl font-semibold">{p.name}</h2>
            <p className="my-5 text-3xl font-semibold">
              {p.id === 'spotlight' && (
                <span className="block text-sm font-normal">A partir de</span>
              )}
              {p.price ? `R$ ${p.price}` : 'Grátis'}
              {p.price > 0 && <span className="text-sm font-normal">/mês</span>}
            </p>
            <p className="mb-5 text-sm">{p.description}</p>
            <ul className="mb-7 grow space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link
              href={
                p.price
                  ? '/contact?subject=' +
                    encodeURIComponent('Interesse no plano ' + p.name)
                  : '/claim'
              }
              className="rounded-full border px-4 py-3 text-center text-sm"
            >
              {p.price ? 'Tenho interesse' : 'Começar gratuitamente'}
            </Link>
          </section>
        ))}
      </div>
      <p className="text-muted-foreground my-5 text-sm">
        Cobrança ainda não ativada. Contratação por perfil. Mensal sem
        fidelidade; disponibilidade de exposição Spotlight varia por segmento.
        Nenhum plano garante volume de leads ou posição fixa.
      </p>
      <section className="my-12">
        <h2 className="text-2xl font-semibold">
          Serviços ou software: a vitrine acompanha sua oferta.
        </h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">Agências e prestadores</h3>
            <p className="mt-3">
              Mostre especialidades, setores, equipe e cases. Receba pedidos de
              orçamento e organize conversas.
            </p>
          </article>
          <article className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">Software e SaaS</h3>
            <p className="mt-3">
              Apresente funcionalidades, integrações, planos e imagens do
              produto. Direcione compradores para testes e demonstrações.
            </p>
          </article>
        </div>
      </section>
      <section className="max-w-3xl">
        <h2 className="mb-5 text-2xl font-semibold">Dúvidas sobre os planos</h2>
        {faqs.map(([q, a]) => (
          <details key={q} className="border-b py-5">
            <summary className="cursor-pointer font-medium">{q}</summary>
            <p className="text-muted-foreground mt-3">{a}</p>
          </details>
        ))}
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(([name, text]) => ({
              '@type': 'Question',
              name,
              acceptedAnswer: { '@type': 'Answer', text },
            })),
          }),
        }}
      />
    </main>
  );
}
