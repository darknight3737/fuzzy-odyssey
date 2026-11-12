'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

type SavedBusiness = { id: string; name: string; slug: string; kind?: string | null };
const key = 'selletive-shortlist';
const event = 'selletive-shortlist-change';
const empty = '[]';
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(event, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(event, callback); };
}
function snapshot() { return localStorage.getItem(key) || empty; }
function read(value: string): SavedBusiness[] {
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is SavedBusiness => !!item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.slug === 'string').slice(0, 5) : []; } catch { return []; }
}
function useSaved() { return read(useSyncExternalStore(subscribe, snapshot, () => empty)); }
function save(items: SavedBusiness[]) { localStorage.setItem(key, JSON.stringify(items)); window.dispatchEvent(new Event(event)); }
export function DirectorySaveButton({ business }: { business: SavedBusiness }) {
  const items = useSaved();
  const selected = items.some((item) => item.id === business.id);
  return <button type="button" aria-pressed={selected} disabled={!selected && items.length >= 5} onClick={() => save(selected ? items.filter((item) => item.id !== business.id) : [...items, business])} className="rounded-full border px-4 py-2 text-sm disabled:opacity-50" title={!selected && items.length >= 5 ? 'Sua lista já tem 5 empresas' : undefined}>{selected ? 'Salvo ♥' : 'Salvar ♡'}</button>;
}
export function DirectoryShortlist() {
  const items = useSaved();
  if (!items.length) return null;
  const software = items.filter((item) => item.kind === 'software').slice(0, 3);
  return <aside className="my-6 rounded-xl border p-4" aria-label="Empresas salvas"><div className="flex flex-wrap items-center justify-between gap-3"><strong>Lista de favoritos ({items.length}/5)</strong><div className="flex gap-3 text-sm"><Link className="underline" href={`/projects/new?providers=${items.map((item) => item.id).join(',')}`}>Enviar briefing</Link>{software.length > 1 && <Link className="underline" href={`/compare?ids=${software.map((item) => item.id).join(',')}`}>Comparar softwares</Link>}</div></div><ul className="mt-3 flex flex-wrap gap-2">{items.map((item) => <li key={item.id} className="rounded-full bg-muted px-3 py-1 text-sm"><Link href={`/company/${item.slug}`}>{item.name}</Link> <button type="button" aria-label={`Remover ${item.name}`} onClick={() => save(items.filter((saved) => saved.id !== item.id))}>×</button></li>)}</ul></aside>;
}

export function DirectoryShortlistMenu() {
  const items = useSaved();
  return <details className="relative"><summary aria-label={`Favoritos, ${items.length} de 5`} className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-full px-2 text-sm">♡ <span>{items.length}</span></summary><div className="absolute right-0 top-full z-50 w-72 rounded-xl border bg-background p-4 shadow-lg"><strong>Favoritos ({items.length}/5)</strong>{items.length ? <><ul className="my-3 space-y-2">{items.map((item) => <li key={item.id} className="flex justify-between gap-2 text-sm"><Link href={`/company/${item.slug}`}>{item.name}</Link><button type="button" aria-label={`Remover ${item.name}`} onClick={() => save(items.filter((saved) => saved.id !== item.id))}>×</button></li>)}</ul><Link className="text-sm underline" href={`/projects/new?providers=${items.map((item) => item.id).join(',')}`}>Enviar briefing</Link>{items.filter((item) => item.kind === 'software').length > 1 && <Link className="ml-3 text-sm underline" href={`/compare?ids=${items.filter((item) => item.kind === 'software').slice(0, 3).map((item) => item.id).join(',')}`}>Comparar</Link>}</> : <p className="mt-3 text-sm text-muted-foreground">Salve empresas para compará-las ou enviar um briefing.</p>}</div></details>;
}
