'use client';

import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  type BusinessProfileFormValues,
  type BusinessProfileInput,
  BusinessProfileSchema,
} from '~/lib/business/schema';

import { updateBusinessAction } from '../_lib/actions';
import { MediaUpload } from './media-upload';

export function BusinessEditor({ values }: { values: BusinessProfileInput }) {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessProfileFormValues, undefined, BusinessProfileInput>({
    resolver: zodResolver(BusinessProfileSchema),
    defaultValues: values,
  });
  const [message, setMessage] = useState('');
  const action = useAction(updateBusinessAction, { onSuccess: ({ data }) => setMessage(data?.success ? 'Informações salvas com sucesso.' : data?.error || 'Não foi possível salvar.'), onError: () => setMessage('Não foi possível salvar. Tente novamente.') });
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
      onSubmit={handleSubmit(action.execute)}
      className="space-y-6 rounded-2xl border p-6"
    >
      <input type="hidden" {...register('slug')} />
      <input type="hidden" {...register('id')} />
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
          {name === 'logo_url' && <MediaUpload businessId={values.id} kind="logo" onUploaded={(url) => setValue('logo_url', url, { shouldValidate: true })} />}
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
        disabled={action.isPending}
        data-test="save-business"
        className="bg-primary text-primary-foreground rounded-full px-6 py-3 disabled:opacity-50"
      >
        {action.isPending ? 'Salvando…' : 'Salvar alterações'}
      </button>
      <p role="status" aria-live="polite" className="text-sm">
        {message}
      </p>
    </form>
  );
}
