'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { Button } from '@kit/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@kit/ui/form';

import { LeadMessageSchema } from '~/lib/leads/schema';

import {
  sendLeadMessageAction,
  closeLeadAction,
  updateLeadStatusAction,
} from '../_lib/actions';
export function MessageForm({
  briefId,
  businessId,
}: {
  briefId: string;
  businessId: string;
}) {
  const form = useForm({
    resolver: zodResolver(LeadMessageSchema),
    defaultValues: { briefId, businessId, content: '' },
  });
  const action = useAction(sendLeadMessageAction, {
    onSuccess: () => form.reset({ briefId, businessId, content: '' }),
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(action.execute)}
        className="mt-5 space-y-3"
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sua mensagem</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={3}
                  className="w-full rounded-xl border p-3"
                  maxLength={5000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {action.result.serverError && (
          <p role="alert">{action.result.serverError}</p>
        )}
        <Button disabled={action.isExecuting} data-test="send-lead-message">
          Enviar mensagem
        </Button>
      </form>
    </Form>
  );
}
export function CloseLead({ id }: { id: string }) {
  const action = useAction(closeLeadAction);
  return (
    <div>
      <Button
        variant="outline"
        disabled={action.isExecuting}
        onClick={() => action.execute({ id })}
      >
        Encerrar pedido
      </Button>
      {action.result.serverError && (
        <p role="alert">{action.result.serverError}</p>
      )}
    </div>
  );
}
export function LeadStatus({
  briefId,
  businessId,
  status,
}: {
  briefId: string;
  businessId: string;
  status: string;
}) {
  const action = useAction(updateLeadStatusAction);
  return (
    <label className="block text-sm">
      Situação do atendimento{' '}
      <select
        value={status}
        disabled={action.isExecuting}
        onChange={(e) =>
          action.execute({
            briefId,
            businessId,
            status: e.target.value as 'new' | 'contacted' | 'declined',
          })
        }
        className="ml-2 rounded border p-2"
      >
        <option value="new">Novo</option>
        <option value="contacted">Em conversa</option>
        <option value="declined">Sem interesse</option>
      </select>
      {action.result.serverError && (
        <span role="alert">{action.result.serverError}</span>
      )}
    </label>
  );
}
