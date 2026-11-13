'use client';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@kit/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@kit/ui/form';

import { categoryLabel } from '~/lib/directory/category-label';
import { taxonomyKind } from '~/lib/directory/taxonomy';
import { LeadSchema } from '~/lib/leads/schema';

import { submitLeadAction } from '../_lib/actions';
export function BriefForm({
  providers,
  categories,
  email,
  kind,
}: {
  providers: { id: string; name: string }[];
  categories: { id: string; name: string; slug: string }[];
  email: string;
  kind: 'service' | 'software';
}) {
  const [requestId] = useState(() => crypto.randomUUID());
  const form = useForm({
    resolver: zodResolver(LeadSchema),
    defaultValues: {
      request_id: requestId,
      title: '',
      description: '',
      buyer_name: '',
      buyer_email: email,
      buyer_phone: '',
      company_name: '',
      budget: '',
      category_id: '',
      offering_kind: kind,
      timeline: '',
      business_ids: providers.map((p) => p.id),
      consent: false as true,
    },
  });
  const selectedKind = useWatch({
    control: form.control,
    name: 'offering_kind',
  });
  const action = useAction(submitLeadAction);
  const input = 'w-full rounded-xl border bg-background px-4 py-3';
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(action.execute)}
        className="space-y-6"
        data-test="project-brief-form"
      >
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold">Quem receberá seu pedido?</h2>
          {providers.length ? (
            <ul>
              {providers.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          ) : (
            <p>
              Até quatro fornecedores compatíveis com a categoria e o tipo de
              solução escolhidos. Você poderá acompanhar os destinatários no
              painel.
            </p>
          )}
        </div>
        <FormField
          control={form.control}
          name="offering_kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que você procura?</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className={input}
                  onChange={(event) => {
                    field.onChange(event);
                    form.setValue('category_id', '');
                  }}
                >
                  <option value="service">
                    Serviço / agência / consultoria
                  </option>
                  <option value="software">Software / SaaS</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especialidade</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className={input}
                  required={!providers.length}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories
                    .filter(
                      (category) =>
                        taxonomyKind(category.slug) === selectedKind,
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {categoryLabel(c.slug, c.name)}
                      </option>
                    ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {(
          [
            'title',
            'description',
            'buyer_name',
            'buyer_email',
            'buyer_phone',
            'company_name',
            'budget',
            'timeline',
          ] as const
        ).map((name) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {
                    {
                      title: 'Título do projeto',
                      description:
                        'Descreva sua necessidade, objetivos e contexto',
                      buyer_name: 'Seu nome',
                      buyer_email: 'E-mail profissional',
                      buyer_phone: 'Telefone (opcional)',
                      company_name: 'Empresa (opcional)',
                      budget: 'Orçamento em R$ (opcional)',
                      timeline: 'Prazo desejado (opcional)',
                    }[name]
                  }
                </FormLabel>
                <FormControl
                  render={
                    name === 'description' ? (
                      <textarea {...field} rows={6} className={input} />
                    ) : (
                      <input
                        {...field}
                        type={name === 'buyer_email' ? 'email' : 'text'}
                        inputMode={name === 'budget' ? 'decimal' : undefined}
                        className={input}
                      />
                    )
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3">
                <FormControl
                  render={
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-1"
                    />
                  }
                />
                <FormLabel>
                  Autorizo compartilhar este pedido e meus dados de contato com
                  os fornecedores destinatários para conversar sobre esta
                  necessidade.
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {action.result.serverError && (
          <p role="alert">{action.result.serverError}</p>
        )}
        <Button
          type="submit"
          disabled={action.isExecuting}
          data-test="submit-project"
        >
          {action.isExecuting ? 'Enviando…' : 'Enviar pedido gratuitamente'}
        </Button>
        <p className="text-muted-foreground text-sm">
          Você escolhe com quem contratar. A Selletive não garante propostas,
          prazo de resposta ou contratação.
        </p>
      </form>
    </Form>
  );
}
