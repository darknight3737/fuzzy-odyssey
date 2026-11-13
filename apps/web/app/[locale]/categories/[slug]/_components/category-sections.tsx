import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { CompanyLogo } from '~/components/directory-results';
import { SectionHeading } from '~/components/directory-ui';

export function DirectoryIntro({ text }: { text: string }) {
  if (text.length <= 260)
    return <p className="mt-6 mb-10 max-w-[820px] text-[#3d3e45]">{text}</p>;
  return (
    <details className="group mt-6 mb-10 max-w-[820px] text-[#3d3e45]">
      <summary className="cursor-pointer list-none">
        <span className="line-clamp-3 group-open:line-clamp-none">{text}</span>
        <span className="mt-1 inline-block text-sm font-semibold text-[#00756a] underline group-open:hidden">
          Ver mais
        </span>
      </summary>
    </details>
  );
}

type Project = {
  id: string;
  title: string;
  description: string;
  company: {
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
};

export function DirectoryProjects({ items }: { items: Project[] }) {
  return (
    <section aria-labelledby="category-projects" className="mt-20">
      <SectionHeading
        id="category-projects"
        title="Veja o que essas empresas já fizeram"
        subtitle="Projetos publicados pelas próprias empresas desta categoria."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-xl border border-[#dce5e1] bg-white p-6"
          >
            {item.company && (
              <div className="mb-4 flex items-center gap-3">
                <CompanyLogo
                  name={item.company.name}
                  src={item.company.logo_url}
                  size={40}
                />
                <span className="text-sm font-medium text-[#333e49]">
                  {item.company.name}
                </span>
              </div>
            )}
            <h3 className="text-lg leading-snug font-semibold text-[#0f161e]">
              {item.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-[#3d3e45]">
              {item.description}
            </p>
            {item.company && (
              <Link
                href={`/company/${item.company.slug}#portfolio`}
                className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-[#00756a] hover:text-[#004038] hover:underline"
              >
                Ver projeto
                <span className="sr-only"> {item.title}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

type LinkColumn = {
  title: string;
  links: Array<{ href: string; label: string }>;
};

export function DirectoryLinkColumns({ columns }: { columns: LinkColumn[] }) {
  const visible = columns.filter((column) => column.links.length > 0);
  if (!visible.length) return null;
  return (
    <section
      aria-label="Explore mais"
      className="mt-20 grid gap-10 border-t border-[#dce5e1] pt-12 md:grid-cols-2"
    >
      {visible.map((column) => (
        <div key={column.title}>
          <h2 className="text-lg font-semibold text-[#0f161e]">
            {column.title}
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {column.links.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-sm text-[#00756a] hover:text-[#004038] hover:underline"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function DirectoryGuide({ label }: { label: string }) {
  return (
    <section
      aria-labelledby="category-guide"
      className="mt-20 rounded-2xl bg-[#dfe6f1] p-6 md:p-12"
    >
      <h2
        id="category-guide"
        className="text-[26px] leading-tight font-semibold text-[#0f161e] md:text-[32px]"
      >
        Como escolher uma empresa de {label}
      </h2>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="font-semibold text-[#0f161e]">
            1. Compare a experiência
          </h3>
          <p className="mt-2 text-sm text-[#3d3e45]">
            Veja os projetos publicados, setores atendidos e o tamanho da equipe
            de cada empresa.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[#0f161e]">
            2. Leia as avaliações
          </h3>
          <p className="mt-2 text-sm text-[#3d3e45]">
            Avaliações mostram como foi trabalhar com a empresa. Patrocínio não
            altera notas.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[#0f161e]">
            3. Envie um único briefing
          </h3>
          <p className="mt-2 text-sm text-[#3d3e45]">
            Salve até cinco empresas e envie o contexto do seu projeto para
            todas de uma vez.
          </p>
        </div>
      </div>
    </section>
  );
}
