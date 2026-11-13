import Link from 'next/link';

import { ChevronRight, House, Star } from 'lucide-react';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export function formatBRL(value: number) {
  return brl.format(value);
}

export function formatRating(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function reviewCountLabel(count: number) {
  return count === 1 ? '1 avaliação' : `${count} avaliações`;
}

export function Stars({
  value,
  size = 16,
  className = '',
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`inline-flex gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, value - index));
        return (
          <span
            key={index}
            className="relative inline-block"
            style={{ width: size, height: size }}
          >
            <Star
              className="absolute inset-0 text-[#c4cfde]"
              style={{ width: size, height: size }}
              fill="currentColor"
              strokeWidth={0}
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className="text-[#004038]"
                style={{ width: size, height: size }}
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingInline({
  rating,
  count,
  compact = false,
}: {
  rating: number | null;
  count: number;
  compact?: boolean;
}) {
  if (!count)
    return (
      <p className="text-muted-foreground text-sm">Ainda sem avaliações</p>
    );
  const value = Number(rating ?? 0);
  return (
    <p
      className="flex items-center gap-2 text-sm"
      aria-label={`Nota ${formatRating(value)} de 5, ${reviewCountLabel(count)}`}
    >
      <strong className={compact ? 'text-base' : 'text-lg'}>
        {formatRating(value)}
      </strong>
      <Stars value={value} size={compact ? 14 : 16} />
      <span className="text-muted-foreground">({reviewCountLabel(count)})</span>
    </p>
  );
}

export type Crumb = { label: string; href?: string };

export function DirectoryBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Navegação estrutural" className="text-sm">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href="/"
            className="hover:text-foreground flex min-h-6 items-center"
            aria-label="Início"
          >
            <House className="size-4" aria-hidden="true" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-1.5"
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
            {item.href && index < items.length - 1 ? (
              <Link
                className="hover:text-foreground hover:underline"
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function DirectoryHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="bg-[#004038] text-white">
      <div className="mx-auto flex w-[min(100%-32px,1200px)] flex-col items-center px-0 py-12 text-center md:py-20">
        <h1 className="max-w-[820px] text-[36px] leading-[1.1] font-semibold tracking-[-0.5px] text-balance md:text-[56px] md:tracking-[-1px]">
          {title}
        </h1>
        <p className="mt-4 max-w-[640px] text-base text-[#c4ded4] md:text-lg">
          {subtitle}
        </p>
        <Link
          href="/projects/new"
          className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-[#1fbc88] px-6 text-[15px] font-semibold text-[#012620] transition-colors hover:bg-[#1aaf7e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7edcaf]"
        >
          Descrever meu projeto
        </Link>
        <p className="mt-3 text-[13px] text-[#c4ded4]">
          Leva poucos minutos. <strong>Gratuito</strong> para quem procura.
        </p>
      </div>
    </section>
  );
}

export function DirectoryHelpBand() {
  return (
    <section className="mt-16 rounded-2xl bg-[#004038] px-6 py-12 text-center text-white md:px-12 md:py-16">
      <h2 className="text-[26px] leading-tight font-semibold md:text-[32px]">
        Em dúvida sobre qual escolher?
      </h2>
      <p className="mx-auto mt-3 max-w-[620px] text-[#c4ded4]">
        Conte o que sua empresa precisa, revise o pedido e converse com
        fornecedores adequados. Gratuito para quem procura.
      </p>
      <Link
        href="/projects/new"
        className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-[#1fbc88] px-6 text-[15px] font-semibold text-[#012620] transition-colors hover:bg-[#1aaf7e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7edcaf]"
      >
        Descrever meu projeto
      </Link>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  id,
}: {
  title: string;
  subtitle?: React.ReactNode;
  id?: string;
}) {
  return (
    <header className="mb-8">
      <h2
        id={id}
        className="text-[30px] leading-[1.15] font-semibold tracking-[-0.5px] md:text-[40px]"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
      )}
    </header>
  );
}
