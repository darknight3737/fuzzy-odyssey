import Link from 'next/link';

import { ChevronDown, ClipboardList, type LucideIcon } from 'lucide-react';

import { SectionHeading } from '~/components/directory-ui';

export function ProfileSection({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-[136px] border-t border-[#dce5e1] py-12 md:py-16"
    >
      <SectionHeading id={`${id}-title`} title={title} subtitle={subtitle} />
      {children}
    </section>
  );
}

export type ProfileTab = { id: string; label: string; icon: LucideIcon };

export function ProfileTabs({ tabs }: { tabs: ProfileTab[] }) {
  return (
    <nav
      aria-label="Seções do perfil"
      className="sticky top-16 z-10 border-b border-[#dce5e1] bg-white md:top-[72px]"
    >
      <ul className="flex [scrollbar-width:none] overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <li key={id} className="shrink-0">
            <a
              href={`#${id}`}
              className="flex min-h-12 items-center gap-2 border-b-2 border-transparent px-4 text-[15px] font-medium text-[#333e49] hover:border-[#004038] hover:text-[#004038] focus-visible:border-[#004038]"
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Fact({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 text-sm text-[#3d3e45]">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-[#6f7073]"
      />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export function QuoteStrip({
  businessId,
  title,
  text,
}: {
  businessId: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto mt-10 flex max-w-[720px] flex-col items-start gap-4 rounded-xl bg-[#f6fefb] p-6 sm:flex-row sm:items-center">
      <ClipboardList
        aria-hidden="true"
        className="size-6 shrink-0 text-[#004038]"
      />
      <div className="flex-1">
        <p className="font-semibold text-[#0f161e]">{title}</p>
        <p className="text-sm text-[#3d3e45]">{text}</p>
      </div>
      <Link
        href={`/projects/new?providers=${businessId}`}
        className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-[#004038] px-5 text-sm font-semibold text-white hover:bg-[#00544c]"
      >
        Solicitar proposta
      </Link>
    </div>
  );
}

type Service = {
  id: string;
  title: string;
  description: string;
  price_range: string | null;
  delivery_time: string | null;
};

function ServiceRow({
  service,
  businessId,
  canContact,
}: {
  service: Service;
  businessId: string;
  canContact: boolean;
}) {
  return (
    <details className="group border-b border-[#dce5e1] last:border-b-0">
      <summary className="grid min-h-16 cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-[#f7f9f8] md:grid-cols-[1fr_200px_160px_24px]">
        <span className="font-semibold text-[#0f161e]">{service.title}</span>
        <span className="hidden text-sm text-[#3d3e45] md:block">
          {service.price_range ?? 'Sob consulta'}
        </span>
        <span className="hidden text-sm text-[#3d3e45] md:block">
          {service.delivery_time ?? 'Não informado'}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 text-[#6f7073] transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="px-5 pb-6">
        <dl className="mb-4 grid grid-cols-2 gap-3 text-sm md:hidden">
          <div>
            <dt className="text-[#6f7073]">A partir de</dt>
            <dd className="font-medium text-[#0f161e]">
              {service.price_range ?? 'Sob consulta'}
            </dd>
          </div>
          <div>
            <dt className="text-[#6f7073]">Prazo</dt>
            <dd className="font-medium text-[#0f161e]">
              {service.delivery_time ?? 'Não informado'}
            </dd>
          </div>
        </dl>
        <p className="max-w-[720px] text-sm whitespace-pre-line text-[#3d3e45]">
          {service.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          {canContact && (
            <Link
              href={`/projects/new?providers=${businessId}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-[#7b8983] px-4 font-semibold text-[#004038] hover:bg-[#f6fefb]"
            >
              Solicitar proposta
            </Link>
          )}
          <a href="#portfolio" className="text-[#00756a] underline">
            Ver portfólio
          </a>
          <a href="#avaliacoes" className="text-[#00756a] underline">
            Ver avaliações
          </a>
        </div>
      </div>
    </details>
  );
}

export function ServicesTable({
  services,
  businessId,
  canContact,
}: {
  services: Service[];
  businessId: string;
  canContact: boolean;
}) {
  const first = services.slice(0, 8);
  const rest = services.slice(8);
  return (
    <div>
      <div
        aria-hidden="true"
        className="hidden grid-cols-[1fr_200px_160px_24px] gap-4 px-5 pb-3 text-[13px] font-medium text-[#6f7073] md:grid"
      >
        <span>Serviço</span>
        <span>A partir de</span>
        <span>Prazo</span>
        <span />
      </div>
      <div className="rounded-xl border border-[#dce5e1] bg-white">
        {first.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            businessId={businessId}
            canContact={canContact}
          />
        ))}
        {rest.length > 0 && (
          <details className="group/more">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 border-t border-[#dce5e1] text-sm font-semibold text-[#004038] group-open/more:hidden hover:bg-[#f7f9f8]">
              Ver todos os serviços ({services.length})
              <ChevronDown aria-hidden="true" className="size-4" />
            </summary>
            {rest.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                businessId={businessId}
                canContact={canContact}
              />
            ))}
          </details>
        )}
      </div>
    </div>
  );
}

export function ChipList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex min-h-8 items-center rounded-full bg-[#f6fefb] px-3 text-[13px] font-medium text-[#004038]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
