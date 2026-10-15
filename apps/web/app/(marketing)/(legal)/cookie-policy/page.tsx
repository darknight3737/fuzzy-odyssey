import Link from 'next/link';

import { pageMetadata } from '~/lib/seo';

export const metadata = pageMetadata(
  'Política de cookies | Selletive',
  'Política de cookies da plataforma Selletive. Saiba como usar o serviço e proteger seus dados.',
  '/cookie-policy',
);
export default function LegalPage() {
  return (
    <main className="container mx-auto max-w-3xl flex-1 px-6 py-16">
      <h1 className="font-serif text-4xl">Política de cookies</h1>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Cookies essenciais</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Utilizamos cookies e armazenamento necessários para autenticação,
          proteção contra requisições indevidas e preferências da interface.
          Esses recursos permitem manter sua sessão e operar áreas restritas com
          segurança.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Preferências</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Preferências como idioma, aparência e estado de navegação podem ser
          armazenadas no navegador. Você pode remover esses dados nas
          configurações do navegador; isso pode encerrar sua sessão ou redefinir
          preferências.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Medição opcional</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Cookies de publicidade e medição não essenciais devem depender da
          configuração e do consentimento aplicáveis. Esta política não autoriza
          a ativação de rastreamento opcional sem a base legal necessária.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Controle e contato</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Você pode bloquear ou excluir cookies no navegador. Para solicitar
          esclarecimentos sobre o tratamento de dados, entre em contato com
          nossa equipe.
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
