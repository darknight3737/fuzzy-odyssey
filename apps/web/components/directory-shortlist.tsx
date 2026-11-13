'use client';

import { useSyncExternalStore } from 'react';

import Link from 'next/link';

import { Heart } from 'lucide-react';

type SavedBusiness = {
  id: string;
  name: string;
  slug: string;
  kind?: string | null;
};
const key = 'selletive-shortlist';
const event = 'selletive-shortlist-change';
const empty = '[]';
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(event, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(event, callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(key) || empty;
  } catch {
    return empty;
  }
}
function read(value: string): SavedBusiness[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (item): item is SavedBusiness =>
              !!item &&
              typeof item.id === 'string' &&
              typeof item.name === 'string' &&
              typeof item.slug === 'string',
          )
          .slice(0, 5)
      : [];
  } catch {
    return [];
  }
}
function useSaved() {
  return read(useSyncExternalStore(subscribe, snapshot, () => empty));
}
function save(items: SavedBusiness[]) {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event(event));
}
export function DirectorySaveButton({
  business,
  variant = 'button',
}: {
  business: SavedBusiness;
  variant?: 'button' | 'icon' | 'block';
}) {
  const items = useSaved();
  const selected = items.some((item) => item.id === business.id);
  const full = !selected && items.length >= 5;
  const label = selected
    ? `Remover ${business.name} da lista`
    : `Salvar ${business.name} na lista`;
  const styles = {
    icon: 'inline-flex size-11 items-center justify-center rounded-full text-[#004038] hover:bg-[#f6fefb]',
    button:
      'inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#7b8983] bg-white px-4 text-sm font-semibold text-[#004038] hover:bg-[#f6fefb]',
    block:
      'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#7b8983] bg-white px-5 text-[15px] font-semibold text-[#004038] hover:bg-[#f6fefb]',
  }[variant];
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={variant === 'icon' ? label : undefined}
      disabled={full}
      onClick={() =>
        save(
          selected
            ? items.filter((item) => item.id !== business.id)
            : [...items, business],
        )
      }
      className={`${styles} transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
      title={full ? 'Sua lista já tem 5 empresas' : label}
    >
      <Heart
        aria-hidden="true"
        className="size-5"
        fill={selected ? 'currentColor' : 'none'}
      />
      {variant !== 'icon' && (selected ? 'Salva na lista' : 'Salvar na lista')}
    </button>
  );
}
export function DirectoryShortlist() {
  const items = useSaved();
  if (!items.length) return null;
  const software = items.filter((item) => item.kind === 'software').slice(0, 3);
  return (
    <>
      <aside
        className="sticky bottom-0 z-20 mt-8 rounded-t-xl border border-[#dce5e1] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_8px_24px_rgb(1_38_32/0.10)]"
        aria-label="Empresas salvas"
      >
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0f161e]">
              Sua lista ({items.length}/5)
              <span className="ml-2 font-normal text-[#6f7073]">
                {items.length >= 5
                  ? 'Remova uma empresa para adicionar outra.'
                  : 'Salve até 5 empresas para enviar um único briefing.'}
              </span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-[#dce5e1] bg-[#f6fefb] pr-1 pl-3 text-sm text-[#004038]"
                >
                  <Link
                    className="max-w-[180px] truncate hover:underline"
                    href={`/company/${item.slug}`}
                  >
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-full hover:bg-white"
                    aria-label={`Remover ${item.name}`}
                    onClick={() =>
                      save(items.filter((saved) => saved.id !== item.id))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded-lg px-4 text-sm font-semibold text-[#004038] hover:bg-[#f6fefb]"
              onClick={() => save([])}
            >
              Limpar
            </button>
            {software.length > 1 && (
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-[#7b8983] px-4 text-sm font-semibold text-[#004038] hover:bg-[#f6fefb]"
                href={`/compare?ids=${software.map((item) => item.id).join(',')}`}
              >
                Comparar softwares
              </Link>
            )}
            <Link
              className="inline-flex min-h-11 items-center rounded-lg bg-[#004038] px-5 text-sm font-semibold text-white hover:bg-[#00544c]"
              href={`/projects/new?providers=${items.map((item) => item.id).join(',')}`}
            >
              Enviar briefing
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export function DirectoryShortlistMenu() {
  const items = useSaved();
  return (
    <details className="relative">
      <summary
        aria-label={`Favoritos, ${items.length} de 5`}
        className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-full px-2 text-sm"
      >
        ♡ <span>{items.length}</span>
      </summary>
      <div className="bg-background absolute top-full right-0 z-50 w-72 rounded-xl border p-4 shadow-lg">
        <strong>Favoritos ({items.length}/5)</strong>
        {items.length ? (
          <>
            <ul className="my-3 space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-2 text-sm"
                >
                  <Link href={`/company/${item.slug}`}>{item.name}</Link>
                  <button
                    type="button"
                    aria-label={`Remover ${item.name}`}
                    onClick={() =>
                      save(items.filter((saved) => saved.id !== item.id))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <Link
              className="text-sm underline"
              href={`/projects/new?providers=${items.map((item) => item.id).join(',')}`}
            >
              Enviar briefing
            </Link>
            {items.filter((item) => item.kind === 'software').length > 1 && (
              <Link
                className="ml-3 text-sm underline"
                href={`/compare?ids=${items
                  .filter((item) => item.kind === 'software')
                  .slice(0, 3)
                  .map((item) => item.id)
                  .join(',')}`}
              >
                Comparar
              </Link>
            )}
          </>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm">
            Salve empresas para compará-las ou enviar um briefing.
          </p>
        )}
      </div>
    </details>
  );
}
