'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { toast } from '@kit/ui/sonner';

import { DetailsSchema } from '~/lib/business/details-schema';

import { saveDetailsAction } from '../_lib/details-actions';

type Values = z.infer<typeof DetailsSchema>;
const fields = [
  ['features', 'Recursos do software'],
  ['integrations', 'Integrações'],
  ['clients', 'Clientes'],
  ['sectors', 'Setores atendidos'],
  ['team_story', 'História da equipe'],
  ['team_photo_url', 'URL da foto da equipe'],
  ['pricing_model', 'Preços e planos'],
  ['deployment', 'Implantação'],
  ['support_languages', 'Suporte'],
  ['buyer_sizes', 'Tamanho de cliente atendido'],
  ['linkedin', 'LinkedIn'],
  ['instagram', 'Instagram'],
  ['address_text', 'Endereço'],
] as const;
const premiumFields = [
  ['cover_image_url', 'URL da imagem de capa'],
  ['video_url', 'URL do vídeo'],
  ['calendar_url', 'URL do agendamento'],
  ['custom_cta_label', 'Texto do botão personalizado'],
  ['custom_cta_url', 'URL do botão personalizado'],
] as const;
export function DetailsEditor({
  values,
  paid,
  vendors,
}: {
  values: Values;
  paid: boolean;
  vendors: { id: string; name: string }[];
}) {
  const form = useForm({
    resolver: zodResolver(DetailsSchema),
    defaultValues: values,
  });
  const action = useAction(saveDetailsAction, {
    onSuccess: () => toast.success('Detalhes salvos.'),
    onError: () => toast.error('Não foi possível salvar os detalhes.'),
  });
  return (
    <section className="my-8 rounded-xl border p-6">
      <h2 className="mb-4 text-xl font-semibold">Detalhes do perfil</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Separe listas com vírgulas. Para imagens e links, use uma URL HTTPS
        pública.
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(action.execute)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="offering_kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de oferta</FormLabel>
                <FormControl>
                  <select className="w-full rounded-lg border p-3" {...field}>
                    <option value="service">Serviço</option>
                    <option value="software">Software</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vendor_business_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor deste software</FormLabel>
                <FormControl>
                  <select className="w-full rounded-lg border p-3" {...field}>
                    <option value="">Sem fornecedor associado</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {[...fields, ...(paid ? premiumFields : [])].map(([name, label]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <textarea
                      rows={
                        name === 'team_story' || name === 'pricing_model'
                          ? 4
                          : 1
                      }
                      className="w-full rounded-lg border p-3"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          {(
            [
              ['free_trial', 'Oferece teste grátis'],
              ['free_plan', 'Oferece plano grátis'],
              ['portuguese', 'Disponível em português'],
            ] as const
          ).map(([name, label]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>{label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
          <button
            disabled={action.isPending}
            className="bg-primary text-primary-foreground rounded-full px-6 py-3"
          >
            {action.isPending ? 'Salvando…' : 'Salvar detalhes'}
          </button>
        </form>
      </Form>
    </section>
  );
}
