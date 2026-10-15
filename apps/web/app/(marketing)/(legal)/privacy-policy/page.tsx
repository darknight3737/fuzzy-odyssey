import Link from 'next/link';

import { pageMetadata } from '~/lib/seo';

export const metadata = pageMetadata(
  'Política de privacidade | Selletive',
  'Política de privacidade da plataforma Selletive. Saiba como usar o serviço e proteger seus dados.',
  '/privacy-policy',
);
export default function LegalPage() {
  return (
    <main className="container mx-auto max-w-3xl flex-1 px-6 py-16">
      <h1 className="font-serif text-4xl">Política de privacidade</h1>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Dados que tratamos</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Tratamos dados da sua conta, como nome e e-mail, informações
          comerciais dos perfis e avaliações que você envia. Informações
          empresariais publicadas podem ter origem em fontes públicas ou ser
          fornecidas pelo representante da empresa.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Finalidades</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Usamos os dados para autenticar contas, administrar perfis, verificar
          acesso ao domínio corporativo, publicar avaliações aprovadas e
          responder solicitações. O e-mail de quem escreve uma avaliação não é
          exibido publicamente.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Compartilhamento e segurança</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Utilizamos fornecedores de infraestrutura e autenticação para operar o
          serviço. O acesso a informações de gestão é restrito às contas
          autorizadas. Não publique informações confidenciais em descrições ou
          avaliações.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Seus direitos</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Você pode solicitar acesso, correção, exclusão ou informações sobre o
          tratamento dos seus dados pelos nossos canais de contato. A exclusão
          de conta está disponível nas configurações. Podemos preservar
          registros necessários ao cumprimento de obrigações legais e à
          prevenção de fraude.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Retenção</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Mantemos dados pelo tempo necessário para prestar o serviço e atender
          obrigações legais. Solicitações sobre perfis empresariais e dados
          pessoais são analisadas conforme a finalidade e a legislação
          aplicável.
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
