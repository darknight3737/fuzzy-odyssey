import Link from 'next/link';

import { pageMetadata } from '~/lib/seo';

export const metadata = pageMetadata(
  'Central de ajuda | Selletive',
  'Encontre ajuda para buscar fornecedores, comparar softwares, publicar projetos e administrar seu perfil na Selletive.',
  '/help',
);

const topics = [
  {
    title: 'Encontrar serviços e software',
    description:
      'Use os filtros por categoria e salve os perfis que quer consultar depois. Na lista de favoritos, você também pode comparar softwares.',
    links: [
      { href: '/search?kind=service', label: 'Explorar serviços' },
      { href: '/search?kind=software', label: 'Explorar softwares' },
    ],
  },
  {
    title: 'Publicar um projeto',
    description:
      'Descreva o que você procura, seu prazo e seu orçamento. Acompanhe seu pedido e as conversas pelo painel.',
    links: [{ href: '/projects/new', label: 'Publicar projeto' }],
  },
  {
    title: 'Cadastrar ou administrar um perfil',
    description:
      'Cadastre uma nova oferta ou reivindique o perfil existente da sua empresa para atualizar as informações.',
    links: [
      { href: '/home/offerings/new', label: 'Cadastrar empresa ou software' },
      { href: '/claim', label: 'Reivindicar perfil' },
      { href: '/pricing', label: 'Planos e preços' },
    ],
  },
  {
    title: 'Resolver outras dúvidas',
    description:
      'Consulte as perguntas frequentes sobre perfis, verificação e avaliações ou fale com a equipe.',
    links: [
      { href: '/faq', label: 'Perguntas frequentes' },
      { href: '/contact', label: 'Falar com a equipe' },
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="container mx-auto flex-1 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">
        Central de ajuda
      </h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {topics.map((topic) => (
          <section key={topic.title} className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">{topic.title}</h2>
            <p className="text-muted-foreground mt-2">{topic.description}</p>
            <ul className="mt-4 space-y-2">
              {topic.links.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-primary underline underline-offset-4"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
