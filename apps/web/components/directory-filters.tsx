'use client';

import { useId, useState } from 'react';

import Link from 'next/link';

import {
  ChevronDown,
  Layers,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Wallet,
} from 'lucide-react';

import { type Crumb, DirectoryBreadcrumbs } from '~/components/directory-ui';
import type { DirectoryParams } from '~/lib/directory/marketplace';
import type {
  DirectoryOption,
  DirectoryOptions,
} from '~/lib/directory/options';

const field =
  'block w-full rounded-lg border border-[#7b8983] bg-white px-4 text-base text-[#0f161e] min-h-12 focus-visible:border-[#00756a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00756a]';

const budgets = [
  { value: '1000', label: 'Até R$ 1 mil' },
  { value: '5000', label: 'Até R$ 5 mil' },
  { value: '10000', label: 'Até R$ 10 mil' },
  { value: '25000', label: 'Até R$ 25 mil' },
  { value: '50000', label: 'Até R$ 50 mil' },
  { value: '100000', label: 'Até R$ 100 mil' },
];

const moreKeys = [
  'min_budget',
  'min_team',
  'max_team',
  'founded_before',
  'languages',
  'remote',
  'has_works',
  'has_awards',
  'features',
  'integrations',
  'pricing_model',
  'deployment',
  'buyer_sizes',
  'support_languages',
  'free_trial',
  'free_plan',
  'portuguese',
];

function submitOnChange(event: React.ChangeEvent<HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

function IconSelect({
  icon: Icon,
  label,
  name,
  value,
  form,
  children,
  className = '',
}: {
  icon: typeof MapPin;
  label: string;
  name: string;
  value: string;
  form: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#6f7073]"
      />
      <select
        name={name}
        form={form}
        defaultValue={value}
        onChange={submitOnChange}
        className={`${field} appearance-none pr-10 pl-12`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#6f7073]"
      />
    </label>
  );
}

function Options({
  empty,
  options,
}: {
  empty: string;
  options: DirectoryOption[];
}) {
  return (
    <>
      <option value="">{empty}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </>
  );
}

export function DirectoryFilters({
  params,
  category,
  location,
  options,
  total,
  breadcrumbs,
}: {
  params: DirectoryParams;
  category?: string;
  location?: string;
  options: DirectoryOptions;
  total?: number;
  breadcrumbs?: Crumb[];
}) {
  const formId = useId();
  const value = (key: string) => {
    const item = params[key];
    return typeof item === 'string' ? item : '';
  };
  const activeMore = moreKeys.filter((key) => value(key)).length;
  const [state, setState] = useState({
    kind: value('kind'),
    open: activeMore > 0,
  });
  const check = (name: string, label: string) => (
    <label
      key={name}
      className="flex min-h-11 items-center gap-3 text-sm text-[#3d3e45]"
    >
      <input
        type="checkbox"
        name={name}
        value="true"
        form={formId}
        defaultChecked={value(name) === 'true'}
        className="size-5 accent-[#004038]"
      />
      {label}
    </label>
  );
  const text = (name: string, label: string, placeholder?: string) => (
    <label key={name} className="block text-sm font-medium text-[#0f161e]">
      {label}
      <input
        name={name}
        form={formId}
        maxLength={120}
        defaultValue={value(name)}
        className={`${field} mt-2`}
        placeholder={placeholder}
      />
    </label>
  );
  const number = (name: string, label: string) => (
    <label key={name} className="block text-sm font-medium text-[#0f161e]">
      {label}
      <input
        name={name}
        type="number"
        min="0"
        max="999999999"
        form={formId}
        defaultValue={value(name)}
        className={`${field} mt-2`}
      />
    </label>
  );
  return (
    <div
      role="search"
      aria-label="Filtrar empresas"
      className="border-b border-[#dce5e1] pb-6"
    >
      <form id={formId} />
      {category && (
        <input type="hidden" name="category" value={category} form={formId} />
      )}
      {location && (
        <input type="hidden" name="location" value={location} form={formId} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6">
        <div className="min-w-0">
          {breadcrumbs && <DirectoryBreadcrumbs items={breadcrumbs} />}
        </div>
        <div className="flex items-center gap-4 text-sm">
          {total != null && (
            <p aria-live="polite" className="text-[#3d3e45]">
              <strong className="text-[#0f161e] tabular-nums">{total}</strong>{' '}
              resultados encontrados
            </p>
          )}
          <label className="flex items-center gap-2 text-[#3d3e45]">
            Ordenar por
            <span className="relative">
              <select
                name="sort"
                form={formId}
                defaultValue={value('sort') || 'relevance'}
                onChange={submitOnChange}
                className="min-h-11 appearance-none rounded-lg bg-transparent pr-7 pl-2 font-semibold text-[#0f161e] hover:bg-[#f7f9f8] focus-visible:outline-2 focus-visible:outline-[#00756a]"
              >
                <option value="relevance">Relevância</option>
                <option value="rating">Avaliação</option>
                <option value="price">Menor preço</option>
                <option value="name">Nome</option>
                <option value="team">Equipe</option>
                <option value="works">Projetos</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-1.5 size-4 -translate-y-1/2"
              />
            </span>
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="relative block min-w-[240px] flex-[2_1_240px]">
          <span className="sr-only">Buscar empresa, serviço ou software</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#6f7073]"
          />
          <input
            name="q"
            form={formId}
            maxLength={120}
            defaultValue={value('q')}
            placeholder="Empresa, serviço ou software"
            className={`${field} pl-12`}
          />
        </label>
        {!location && (
          <IconSelect
            icon={MapPin}
            label="Localização"
            name="location"
            value={value('location')}
            form={formId}
            className="flex-[1_1_200px]"
          >
            <Options empty="Todas as localidades" options={options.locations} />
          </IconSelect>
        )}
        {!category && (
          <IconSelect
            icon={Layers}
            label="Categoria"
            name="category"
            value={value('category')}
            form={formId}
            className="flex-[1_1_200px]"
          >
            <Options empty="Todas as categorias" options={options.categories} />
          </IconSelect>
        )}
        <IconSelect
          icon={Star}
          label="Avaliação mínima"
          name="min_rating"
          value={value('min_rating')}
          form={formId}
          className="flex-[1_1_170px]"
        >
          <option value="">Qualquer avaliação</option>
          <option value="3">3 estrelas ou mais</option>
          <option value="4">4 estrelas ou mais</option>
          <option value="5">5 estrelas</option>
        </IconSelect>
        <IconSelect
          icon={Wallet}
          label="Seu orçamento"
          name="max_budget"
          value={value('max_budget')}
          form={formId}
          className="flex-[1_1_180px]"
        >
          <option value="">Qualquer orçamento</option>
          {budgets.map((budget) => (
            <option key={budget.value} value={budget.value}>
              {budget.label}
            </option>
          ))}
          {value('max_budget') &&
            !budgets.some((budget) => budget.value === value('max_budget')) && (
              <option value={value('max_budget')}>
                Até R$ {Number(value('max_budget')).toLocaleString('pt-BR')}
              </option>
            )}
        </IconSelect>
        <label className="relative block flex-[1_1_160px]">
          <span className="sr-only">Tipo de empresa</span>
          <select
            name="kind"
            form={formId}
            value={state.kind}
            onChange={(event) => {
              setState({ ...state, kind: event.target.value });
              event.currentTarget.form?.requestSubmit();
            }}
            className={`${field} appearance-none pr-10`}
          >
            <option value="">Serviços e software</option>
            <option value="service">Somente serviços</option>
            <option value="software">Somente software</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#6f7073]"
          />
        </label>
        <button
          type="button"
          aria-expanded={state.open}
          aria-controls={`${formId}-more`}
          onClick={() => setState({ ...state, open: !state.open })}
          className={`inline-flex min-h-12 items-center gap-2 rounded-lg border px-5 text-[15px] font-semibold transition-colors ${state.open || activeMore ? 'border-[#00756a] bg-[#f6fefb] text-[#004038]' : 'border-[#7b8983] bg-white text-[#004038] hover:bg-[#f6fefb]'}`}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Mais filtros
          {activeMore > 0 && (
            <span className="rounded-full bg-[#004038] px-2 text-xs text-white">
              {activeMore}
            </span>
          )}
        </button>
        <button
          type="submit"
          form={formId}
          className="inline-flex min-h-12 items-center rounded-lg bg-[#004038] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#00544c] active:bg-[#00332d]"
        >
          Aplicar filtros
        </button>
      </div>
      <div
        id={`${formId}-more`}
        hidden={!state.open}
        className="mt-4 rounded-xl border border-[#dce5e1] bg-[#f7f9f8] p-6"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {number('min_budget', 'Orçamento mínimo da empresa (R$)')}
        </div>
        {state.kind !== 'software' && (
          <fieldset className="mt-6 border-t border-[#dce5e1] pt-6">
            <legend className="text-sm font-semibold text-[#0f161e]">
              Prestadores de serviço
            </legend>
            <div className="mt-4 grid gap-6 md:grid-cols-3">
              {number('min_team', 'Equipe mínima')}
              {number('max_team', 'Equipe máxima')}
              {number('founded_before', 'Fundada até o ano')}
              {text('languages', 'Idiomas', 'Separados por vírgula')}
            </div>
            <div className="mt-2 grid gap-x-6 md:grid-cols-3">
              {check('remote', 'Atendimento remoto')}
              {check('has_works', 'Com projetos publicados')}
              {check('has_awards', 'Com prêmios')}
            </div>
          </fieldset>
        )}
        {state.kind !== 'service' && (
          <fieldset className="mt-6 border-t border-[#dce5e1] pt-6">
            <legend className="text-sm font-semibold text-[#0f161e]">
              Software
            </legend>
            <div className="mt-4 grid gap-6 md:grid-cols-3">
              {text('features', 'Recursos', 'Separados por vírgula')}
              {text('integrations', 'Integrações', 'Separadas por vírgula')}
              {text('pricing_model', 'Modelo de preços')}
              {text('deployment', 'Implantação')}
              {text('buyer_sizes', 'Porte do comprador')}
              {text('support_languages', 'Idiomas de suporte')}
            </div>
            <div className="mt-2 grid gap-x-6 md:grid-cols-3">
              {check('free_trial', 'Teste grátis')}
              {check('free_plan', 'Plano grátis')}
              {check('portuguese', 'Suporte em português')}
            </div>
          </fieldset>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Link
            href="?"
            className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-[#004038] hover:bg-white"
          >
            Limpar filtros
          </Link>
          <button
            type="submit"
            form={formId}
            className="inline-flex min-h-11 items-center rounded-lg bg-[#004038] px-5 text-sm font-semibold text-white hover:bg-[#00544c]"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  );
}

function pageWindow(page: number, last: number) {
  const pages = new Set([1, last, page - 1, page, page + 1]);
  return [...pages]
    .filter((item) => item >= 1 && item <= last)
    .sort((a, b) => a - b);
}

export function DirectoryPagination({
  params,
  page,
  total,
}: {
  params: DirectoryParams;
  page: number;
  total: number;
}) {
  const last = Math.max(1, Math.ceil(total / 24));
  const href = (next: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (typeof value === 'string' && value && key !== 'page')
        query.set(key, value);
    if (next > 1) query.set('page', String(next));
    return `?${query}`;
  };
  const step =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-semibold';
  const pages = pageWindow(page, last);
  return (
    <nav
      aria-label="Paginação"
      className="mt-10 flex flex-col items-center gap-3"
    >
      <div className="flex flex-wrap items-center justify-center gap-1">
        {page > 1 ? (
          <Link
            className={`${step} text-[#004038] hover:bg-[#f6fefb]`}
            href={href(page - 1)}
          >
            ← Anterior
          </Link>
        ) : (
          <span className={`${step} text-[#6f7073]`} aria-disabled="true">
            ← Anterior
          </span>
        )}
        {pages.map((item, index) => (
          <span key={item} className="flex items-center gap-1">
            {index > 0 && item - pages[index - 1]! > 1 && (
              <span aria-hidden="true" className="px-1 text-[#6f7073]">
                …
              </span>
            )}
            {item === page ? (
              <span
                aria-current="page"
                className={`${step} bg-[#004038] text-white`}
              >
                <span className="sr-only">Página atual, </span>
                {item}
              </span>
            ) : (
              <Link
                className={`${step} text-[#0f161e] hover:bg-[#f6fefb]`}
                href={href(item)}
                aria-label={`Ir para a página ${item}`}
              >
                {item}
              </Link>
            )}
          </span>
        ))}
        {page < last ? (
          <Link
            className={`${step} text-[#004038] hover:bg-[#f6fefb]`}
            href={href(page + 1)}
          >
            Próxima →
          </Link>
        ) : (
          <span className={`${step} text-[#6f7073]`} aria-disabled="true">
            Próxima →
          </span>
        )}
      </div>
      <p className="text-sm text-[#6f7073]">
        Página {page} de {last}
      </p>
    </nav>
  );
}
