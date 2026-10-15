import Link from 'next/link';

import { pageMetadata, serializeJsonLd } from '~/lib/seo';

export const metadata = pageMetadata(
  'Perguntas frequentes | Selletive',
  'Saiba como encontrar empresas, reivindicar um perfil e publicar avaliações na Selletive.',
  '/faq',
);
const items = [
  [
    'O que é a Selletive?',
    'Um diretório de empresas e serviços B2B. Você pode descobrir parceiros por especialidade, localização e informações dos perfis.',
  ],
  [
    'Preciso pagar para buscar empresas?',
    'Não. Explorar categorias, consultar perfis e acessar os contatos publicados é gratuito.',
  ],
  [
    'Como reivindicar minha empresa?',
    'Encontre sua empresa na página de reivindicação. Crie uma conta com e-mail corporativo, confirme esse e-mail e reivindique o perfil. O domínio do e-mail deve ser igual ao do site cadastrado.',
  ],
  [
    'Minha empresa não está cadastrada. E agora?',
    'Entre em contato com nossa equipe para solicitar a inclusão ou corrigir dados de um perfil existente.',
  ],
  [
    'Posso alterar as informações do perfil?',
    'Sim. Depois de reivindicar o perfil, você pode editar nome, descrição, contatos, site e informações da equipe no seu painel.',
  ],
  [
    'Como funcionam as avaliações?',
    'Usuários autenticados podem enviar uma avaliação. Ela passa por moderação antes da publicação. A empresa não pode aprovar suas próprias avaliações.',
  ],
  [
    'O selo de verificação é a mesma coisa que reivindicar?',
    'Não. Reivindicar confirma acesso ao domínio corporativo. A verificação e os destaques são estados separados, administrados pela plataforma.',
  ],
];
export default function FAQPage() {
  return (
    <main className="container mx-auto max-w-3xl flex-1 px-6 py-20">
      <h1 className="font-serif text-5xl">Vamos esclarecer.</h1>
      <p className="text-muted-foreground my-6">
        Tudo que você precisa para dar o próximo passo.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map(([q, a]) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }),
        }}
      />
      <div className="mt-10 divide-y">
        {items.map(([q, a]) => (
          <details key={q} className="py-6">
            <summary className="cursor-pointer text-lg font-medium">
              {q}
            </summary>
            <p className="text-muted-foreground mt-4 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10">
        Precisa de ajuda?{' '}
        <Link href="/contact" className="underline">
          Fale com nossa equipe.
        </Link>
      </p>
    </main>
  );
}
