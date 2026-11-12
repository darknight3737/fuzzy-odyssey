'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { toast } from '@kit/ui/sonner';

import { ResponseSchema } from '~/lib/business/response-schema';

import { saveResponseAction } from '../_lib/response-actions';
export function ResponseEditor({
  businessId,
  slug,
  reviewId,
  responseId,
  response,
}: {
  businessId: string;
  slug: string;
  reviewId: string;
  responseId?: string;
  response?: string;
}) {
  const form = useForm({
    resolver: zodResolver(ResponseSchema),
    defaultValues: {
      businessId,
      slug,
      reviewId,
      responseId,
      response: response ?? '',
    },
  });
  const action = useAction(saveResponseAction, {
    onSuccess: () => toast.success('Resposta salva.'),
    onError: () => toast.error('Não foi possível salvar a resposta.'),
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(action.execute)}
        className="mt-3 space-y-3"
      >
        <FormField
          control={form.control}
          name="response"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sua resposta</FormLabel>
              <FormControl>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border p-3"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button
          disabled={action.isPending}
          className="rounded-full border px-4 py-2 text-sm"
        >
          {action.isPending ? 'Salvando…' : 'Salvar resposta'}
        </button>
      </form>
    </Form>
  );
}
