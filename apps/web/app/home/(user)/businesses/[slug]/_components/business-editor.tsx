'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  type BusinessProfileFormValues,
  type BusinessProfileInput,
  BusinessProfileSchema,
} from '~/lib/business/schema';

import { updateBusinessAction } from '../_lib/actions';

export function BusinessEditor({ values }: { values: BusinessProfileInput }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessProfileFormValues, undefined, BusinessProfileInput>({
    resolver: zodResolver(BusinessProfileSchema),
    defaultValues: values,
  });
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const fields = [
    ['name', 'Nome da empresa', 'text'],
    ['website', 'Site', 'url'],
    ['email', 'E-mail de contato', 'email'],
    ['phone', 'Telefone', 'tel'],
    ['logo_url', 'URL do logotipo', 'url'],
    ['employee_count', 'Tamanho da equipe', 'number'],
    ['founded_year', 'Ano de fundação', 'number'],
  ] as const;
  return (
    <form
      onSubmit={handleSubmit((data) =>
        startTransition(async () => {
          setMessage('');
          try {
            const result = await updateBusinessAction(data);
            setMessage(
              result?.data?.success ? 'Informações salvas com sucesso.' : result?.data?.error || 'Não foi possível concluir. Confira os dados e tente novamente.',
            );
          } catch {
            setMessage('Não foi possível salvar. Tente novamente.');
          }
        }),
      )}
      className="space-y-6 rounded-2xl border p-6"
    >
      <input type="hidden" {...register('slug')} />
      {fields.map(([name, label, type]) => (
        <div key={name}>
          <label htmlFor={name} className="mb-2 block text-sm font-medium">
            {label}
          </label>
          <input
            id={name}
            type={type}
            {...register(name)}
            aria-invalid={!!errors[name]}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
            className="w-full rounded-lg border p-3"
          />
          {errors[name] && (
            <p id={`${name}-error`} className="text-destructive mt-2 text-sm">
              {errors[name].message}
            </p>
          )}
        </div>
      ))}
      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Sobre a empresa
        </label>
        <textarea
          id="description"
          rows={7}
          {...register('description')}
          className="w-full rounded-lg border p-3"
        />
        {errors.description && (
          <p className="text-destructive text-sm">
            {errors.description.message}
          </p>
        )}
      </div>
      <label className="flex items-center gap-3">
        <input type="checkbox" {...register('works_remotely')} />
        Atendemos remotamente
      </label>
      <button
        disabled={pending}
        data-test="save-business"
        className="bg-primary text-primary-foreground rounded-full px-6 py-3 disabled:opacity-50"
      >
        {pending ? 'Salvando…' : 'Salvar alterações'}
      </button>
      <p role="status" aria-live="polite" className="text-sm">
        {message}
      </p>
    </form>
  );
}
