'use client';
import { useState } from 'react';

import Link from 'next/link';

import { DirectoryImage } from '~/components/directory-image';
import {
  DirectorySaveButton,
  DirectoryShortlist,
} from '~/components/directory-shortlist';
import type { DirectoryItem } from '~/lib/directory/marketplace';

function DirectoryCard({
  item,
  sponsored = false,
}: {
  item: DirectoryItem;
  sponsored?: boolean;
}) {
  const {
    business: b,
    average_rating,
    review_count,
    location_name,
    works_count,
  } = item;
  return (
    <article key={b.id} className="flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-start gap-3">
        {b.logo_url && (
          <DirectoryImage
            src={b.logo_url}
            width={48}
            height={48}
            sizes="48px"
            alt=""
            className="h-12 w-12 rounded object-cover"
          />
        )}
        <div>
          <h2 className="text-lg font-semibold">
            <Link href={`/company/${b.slug}`}>{b.name}</Link>
          </h2>
          <p className="text-muted-foreground text-sm">
            {location_name ||
              (b.works_remotely
                ? 'Atendimento remoto'
                : 'Localização não informada')}
          </p>
        </div>
      </div>
      {sponsored && <span className="text-xs">Patrocinado</span>}
      <p className="text-sm">
        {review_count
          ? `★ ${Number(average_rating).toFixed(1)} · ${review_count} avaliações`
          : 'Ainda sem avaliações'}
      </p>
      {b.description && (
        <p className="text-muted-foreground line-clamp-3 text-sm">
          {b.description}
        </p>
      )}
      <p className="text-muted-foreground text-sm">
        {b.employee_count != null
          ? `${b.employee_count} pessoas`
          : 'Equipe não informada'}{' '}
        ·{' '}
        {works_count != null
          ? `${works_count} projetos`
          : 'Projetos não informados'}{' '}
        ·{' '}
        {b.min_budget != null
          ? `A partir de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(b.min_budget)}`
          : 'Preço sob consulta'}
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        <DirectorySaveButton
          business={{
            id: b.id,
            name: b.name,
            slug: b.slug,
            kind: b.offering_kind,
          }}
        />
        <Link
          href={`/company/${b.slug}`}
          className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm"
        >
          Ver perfil
        </Link>
      </div>
    </article>
  );
}

export function DirectoryResults({
  items,
  spotlight = false,
}: {
  items: DirectoryItem[];
  spotlight?: boolean;
}) {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const grid =
    layout === 'grid'
      ? 'grid gap-5 md:grid-cols-2 lg:grid-cols-3'
      : 'grid gap-5';
  const promoted = spotlight
    ? items.filter((item) => item.business.tier === 'spotlight').slice(0, 3)
    : [];
  const organic = items.filter(
    (item) =>
      !promoted.some((promotion) => promotion.business.id === item.business.id),
  );
  return (
    <>
      <DirectoryShortlist />
      <div className="mb-4 flex justify-end gap-2" aria-label="Visualização">
        <button
          type="button"
          aria-pressed={layout === 'grid'}
          onClick={() => setLayout('grid')}
          className="rounded border px-3 py-1"
        >
          Grade
        </button>
        <button
          type="button"
          aria-pressed={layout === 'list'}
          onClick={() => setLayout('list')}
          className="rounded border px-3 py-1"
        >
          Lista
        </button>
      </div>
      {promoted.length > 0 && (
        <section
          aria-label="Empresas Spotlight"
          className="bg-muted/30 mb-8 rounded-xl border p-4"
        >
          <h2 className="mb-3 text-lg font-semibold">Spotlight</h2>
          <div className={grid}>
            {promoted.map((item) => (
              <DirectoryCard key={item.business.id} item={item} sponsored />
            ))}
          </div>
        </section>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          Nenhuma empresa encontrada. Experimente outros filtros.
        </p>
      ) : (
        <div className={grid}>
          {organic.map((item) => (
            <DirectoryCard key={item.business.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
