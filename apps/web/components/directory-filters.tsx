'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DirectoryParams } from '~/lib/directory/marketplace';
import type { DirectoryOption, DirectoryOptions } from '~/lib/directory/options';

const input = 'mt-1 block w-full rounded-lg border bg-background p-2 text-sm';

function FilterSelect({name, value, options, label}: {name:string; value:string; options:DirectoryOption[]; label:string}) {
  return <label className="text-sm">{label}<select name={name} defaultValue={value} className={input}>
    <option value="">Todas</option>
    {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select></label>;
}

export function DirectoryFilters({ params, category, location, options }: { params: DirectoryParams; category?: string; location?: string; options: DirectoryOptions }) {
  const value = (key: string) => { const item = params[key]; return typeof item === 'string' ? item : ''; };
  const [kind, setKind] = useState(value('kind'));
  const check = (name:string, label:string) => <label key={name} className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} value="true" defaultChecked={value(name) === 'true'}/>{label}</label>;
  const text = (name:string, label:string, placeholder?:string) => <label key={name} className="text-sm">{label}<input name={name} maxLength={120} defaultValue={value(name)} className={input} placeholder={placeholder}/></label>;
  const number = (name:string, label:string) => <label key={name} className="text-sm">{label}<input name={name} type="number" min="0" max="999999999" defaultValue={value(name)} className={input}/></label>;
  return <form className="my-6 grid gap-3 rounded-xl border p-4 md:grid-cols-4">
    {text('q','Buscar','Empresa, serviço ou software')}
    {category ? <input type="hidden" name="category" value={category}/> : <FilterSelect name="category" value={value('category')} options={options.categories} label="Categoria"/>}
    {location ? <input type="hidden" name="location" value={location}/> : <FilterSelect name="location" value={value('location')} options={options.locations} label="Localização"/>}
    <label className="text-sm">Tipo<select name="kind" value={kind} onChange={event => setKind(event.target.value)} className={input}><option value="">Todos</option><option value="service">Serviços</option><option value="software">Software</option></select></label>
    <label className="text-sm">Ordenar<select name="sort" defaultValue={value('sort') || 'relevance'} className={input}><option value="relevance">Relevância</option><option value="rating">Avaliação</option><option value="price">Menor preço</option><option value="name">Nome</option><option value="team">Equipe</option><option value="works">Projetos</option></select></label>
    <label className="text-sm">Avaliação mínima<select name="min_rating" defaultValue={value('min_rating')} className={input}><option value="">Qualquer nota</option><option value="3">3 estrelas</option><option value="4">4 estrelas</option><option value="5">5 estrelas</option></select></label>
    <details className="md:col-span-4" open={Object.keys(params).some(key => !['q', 'category', 'location', 'kind', 'sort', 'min_rating', 'page'].includes(key) && value(key)) || undefined}>
      <summary className="cursor-pointer text-sm font-medium">Mais filtros</summary>
      <div className="mt-4 grid gap-3 md:grid-cols-4">{number('min_budget','Orçamento mínimo (R$)')}{number('max_budget','Orçamento máximo (R$)')}</div>
      {kind !== 'software' && <fieldset className="mt-4 grid gap-3 border-t pt-3 md:grid-cols-4"><legend className="text-sm font-medium">Serviços</legend>
        {number('min_team','Equipe mínima')}{number('max_team','Equipe máxima')}{number('founded_before','Fundada até o ano')}{text('languages','Idiomas','Separados por vírgula')}
        {check('remote','Atendimento remoto')}{check('has_works','Com projetos')}{check('has_awards','Com prêmios')}
      </fieldset>}
      {kind !== 'service' && <fieldset className="mt-4 grid gap-3 border-t pt-3 md:grid-cols-4"><legend className="text-sm font-medium">Software</legend>
        {text('features','Recursos','Separados por vírgula')}{text('integrations','Integrações','Separadas por vírgula')}{text('pricing_model','Modelo de preços')}{text('deployment','Implantação')}{text('buyer_sizes','Porte do comprador')}{text('support_languages','Idiomas de suporte')}
        {check('free_trial','Teste grátis')}{check('free_plan','Plano grátis')}{check('portuguese','Suporte em português')}
      </fieldset>}
    </details>
    <button className="rounded-lg bg-primary px-5 py-2 text-sm text-primary-foreground">Aplicar filtros</button>
  </form>;
}
export function DirectoryPagination({ params, page, total }: { params: DirectoryParams; page: number; total: number }) {
  const href = (next: number) => { const query = new URLSearchParams(); for (const [key,value] of Object.entries(params)) if (typeof value === 'string' && value && key !== 'page') query.set(key,value); if(next > 1) query.set('page',String(next)); return `?${query}`; };
  return <nav aria-label="Paginação" className="mt-8 flex justify-between text-sm">{page > 1 ? <Link href={href(page - 1)}>← Anterior</Link> : <span />}<span>Página {page}</span>{page * 24 < total ? <Link href={href(page + 1)}>Próxima →</Link> : <span />}</nav>;
}
