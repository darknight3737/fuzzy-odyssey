import Link from 'next/link';

import { pageMetadata } from '~/lib/seo';

export const metadata = pageMetadata(
  'Perfil gratuito para empresas | Selletive',
  'Reivindique seu perfil gratuitamente, atualize informações e seja encontrado por novos parceiros na Selletive.',
  '/pricing',
);
export default function PricingPage() {
  return (
    <main className="container mx-auto max-w-4xl flex-1 px-6 py-20">
      <p className="text-muted-foreground mb-4 text-sm">
        Sua presença começa aqui
      </p>
      <h1 className="font-serif text-5xl">Um perfil. Novas possibilidades.</h1>
      <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
        Reivindique sua empresa e mantenha suas informações atualizadas, sem
        mensalidade.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border p-8">
          <h2 className="text-2xl font-semibold">Perfil reivindicado</h2>
          <p className="my-6 font-serif text-4xl">Grátis</p>
          <ul className="text-muted-foreground mb-8 space-y-3 text-sm">
            <li>Presença no diretório de empresas</li>
            <li>Edição de informações e contatos</li>
            <li>Perfil por especialidade e localização</li>
            <li>Avaliações de clientes com moderação</li>
          </ul>
          <Link
            href="/claim"
            className="bg-primary text-primary-foreground inline-block rounded-full px-6 py-3"
          >
            Reivindicar minha empresa
          </Link>
        </section>
        <section className="bg-muted/30 rounded-2xl border p-8">
          <h2 className="text-2xl font-semibold">Mais visibilidade</h2>
          <p className="text-muted-foreground my-6 leading-relaxed">
            Quer conhecer as opções de destaque para sua empresa? Fale com nossa
            equipe para saber mais sobre disponibilidade e condições.
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-full border px-6 py-3"
          >
            Conversar com a equipe
          </Link>
        </section>
      </div>
    </main>
  );
}
