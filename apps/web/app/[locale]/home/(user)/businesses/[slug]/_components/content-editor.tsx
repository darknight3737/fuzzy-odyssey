'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@kit/ui/form';
import { toast } from '@kit/ui/sonner';

import { ContentSchema } from '~/lib/business/content-schema';

import { deleteContentAction, saveContentAction } from '../_lib/content-actions';

type Kind = 'service' | 'case' | 'award';
type Item = { id: string; title: string; description: string; detail: string; challenge?: string | null; solution?: string | null; results?: string | null; industry?: string | null; project_type?: string | null; duration?: string | null; budget_range?: string | null; images?: string[] };
const labels = { service: ['Serviço', 'Faixa de preço'], case: ['Case', 'Cliente'], award: ['Prêmio', 'Organização'] } as const;

export function ContentEditor({ businessId, slug, kind, items, paid }: { businessId: string; slug: string; kind: Kind; items: Item[]; paid?: boolean }) {
  return <section className="my-8 space-y-4"><h2 className="text-xl font-semibold">{labels[kind][0]}s</h2>{items.map((item) => <ContentForm key={item.id} businessId={businessId} slug={slug} kind={kind} paid={paid} item={item} />)}<ContentForm businessId={businessId} slug={slug} kind={kind} paid={paid} /></section>;
}

function ContentForm({ businessId, slug, kind, item, paid }: { businessId: string; slug: string; kind: Kind; item?: Item; paid?: boolean }) {
  const form = useForm({ resolver: zodResolver(ContentSchema), defaultValues: { businessId, slug, kind, id: item?.id, title: item?.title ?? '', description: item?.description ?? '', detail: item?.detail ?? '', challenge: item?.challenge ?? '', solution: item?.solution ?? '', results: item?.results ?? '', industry: item?.industry ?? '', project_type: item?.project_type ?? '', duration: item?.duration ?? '', budget_range: item?.budget_range ?? '', images: item?.images?.join(', ') ?? '' } });
  const save = useAction(saveContentAction, { onSuccess: () => { toast.success('Conteúdo salvo.'); if (!item) form.reset(); }, onError: () => toast.error('Não foi possível salvar. Confira os limites do plano.') });
  const remove = useAction(deleteContentAction, { onSuccess: () => toast.success('Conteúdo excluído.'), onError: () => toast.error('Não foi possível excluir.') });
  return <details className="rounded-xl border p-5"><summary className="cursor-pointer font-medium">{item?.title ?? `Adicionar ${labels[kind][0].toLowerCase()}`}</summary><Form {...form}><form onSubmit={form.handleSubmit(save.execute)} className="mt-4 space-y-4">
    <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Título</FormLabel><FormControl><input className="w-full rounded-lg border p-3" {...field} /></FormControl><FormMessage /></FormItem>} />
    <FormField control={form.control} name="detail" render={({ field }) => <FormItem><FormLabel>{labels[kind][1]}</FormLabel><FormControl><input className="w-full rounded-lg border p-3" {...field} /></FormControl><FormMessage /></FormItem>} />
    <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Descrição</FormLabel><FormControl><textarea className="w-full rounded-lg border p-3" rows={4} {...field} /></FormControl><FormMessage /></FormItem>} />
    {kind === 'case' && ([['challenge','Desafio'],['solution','Solução'],['results','Resultados']] as const).map(([name, label]) => <FormField key={name} control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{label}</FormLabel><FormControl><textarea className="w-full rounded-lg border p-3" rows={4} {...field} /></FormControl><FormMessage /></FormItem>} />)}
    {kind === 'case' && ([['industry','Setor'],['project_type','Tipo de projeto'],['duration','Duração'],['budget_range','Orçamento'], ...(paid ? [['images','URLs HTTPS das imagens, separadas por vírgulas'] as const] : [])] as const).map(([name, label]) => <FormField key={name} control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{label}</FormLabel><FormControl><input className="w-full rounded-lg border p-3" {...field} /></FormControl><FormMessage /></FormItem>} />)}
    <div className="flex gap-4"><button disabled={save.isPending} className="bg-primary text-primary-foreground rounded-full px-5 py-2">{save.isPending ? 'Salvando…' : 'Salvar'}</button>{item && <button type="button" disabled={remove.isPending} onClick={() => remove.execute({ businessId, slug, kind, id: item.id })} className="text-destructive underline">Excluir</button>}</div>
  </form></Form></details>;
}
