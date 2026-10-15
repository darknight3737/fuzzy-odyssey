import Link from 'next/link';

import { pageMetadata } from '~/lib/seo';

export const metadata = pageMetadata(
  'Termos de uso | Selletive',
  'Termos de uso da plataforma Selletive. Saiba como usar o serviço e proteger seus dados.',
  '/terms-of-service',
);
export default function LegalPage() {
  return (
    <main className="container mx-auto max-w-3xl flex-1 px-6 py-16">
      <h1 className="font-serif text-4xl">Termos de uso</h1>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">O serviço</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          A Selletive permite consultar empresas, gerenciar perfis autorizados e
          compartilhar experiências. As informações apoiam sua pesquisa; a
          contratação e a negociação ocorrem diretamente entre você e a empresa.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Sua conta e representação</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Mantenha suas credenciais seguras e forneça informações verdadeiras.
          Ao reivindicar um perfil, você declara ter autorização para
          representar a empresa. O acesso a um domínio não substitui a
          responsabilidade por essa declaração.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Conteúdo e avaliações</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Publique apenas conteúdo que você tenha direito de compartilhar.
          Avaliações devem refletir experiências reais e não podem conter dados
          pessoais de terceiros, ameaças, publicidade enganosa ou material
          ilegal. A Selletive pode moderar conteúdo e suspender acessos em caso
          de abuso.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Selos e destaques</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Perfis reivindicados, verificados e destacados têm significados
          distintos. Uma posição de destaque não constitui garantia de
          qualidade, resultado ou recomendação de contratação.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Correções e atendimento</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Informações empresariais podem mudar. Consulte o site oficial antes de
          contratar e comunique dados incorretos à equipe. Solicitações sobre
          acesso, conteúdo ou uso da plataforma podem ser enviadas pelo
          formulário de contato.
        </p>
      </section>
      <p className="mt-10">
        Dúvidas ou solicitações?{' '}
        <Link href="/contact" className="underline">
          Entre em contato.
        </Link>
      </p>
    </main>
  );
}
