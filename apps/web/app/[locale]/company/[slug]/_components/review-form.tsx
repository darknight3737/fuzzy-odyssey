'use client';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@kit/ui/form';
import { submitReviewAction } from '../_lib/review-actions';
import { ReviewSchema } from '../_lib/review-schema';

export function ReviewForm({ businessId, kind }: { businessId: string; kind: string }) {
  const [message, setMessage] = useState('');
  const form = useForm({ resolver: zodResolver(ReviewSchema), defaultValues: { businessId, name: '', rating: 5, title: '', content: '', dimension1: 5, dimension2: 5, dimension3: 5, dimension4: 5 } });
  const action = useAction(submitReviewAction, { onSuccess: ({ data }) => setMessage(data?.success ? 'Avaliação enviada para moderação.' : data?.error || 'Não foi possível enviar.'), onError: () => setMessage('Não foi possível enviar. Entre na sua conta e confira os dados.') });
  const labels = kind === 'software' ? ['Facilidade de uso', 'Funcionalidades', 'Suporte', 'Custo-benefício'] : ['Qualidade', 'Orçamento', 'Prazo', 'Colaboração'];
  return <details className="mt-6 rounded-xl border p-6"><summary className="cursor-pointer font-medium">Compartilhar minha experiência</summary><p className="text-muted-foreground my-4 text-sm">Entre na sua conta para enviar uma avaliação. Todas passam por moderação.</p><Form {...form}><form onSubmit={form.handleSubmit(action.execute)} className="grid gap-4">
    {([['name','Seu nome'],['title','Título'],['content','Sua experiência']] as const).map(([name,label]) => <FormField key={name} control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{label}</FormLabel><FormControl>{name === 'content' ? <textarea rows={5} className="w-full rounded-lg border p-3" {...field} /> : <input className="w-full rounded-lg border p-3" {...field} />}</FormControl><FormMessage /></FormItem>} />)}
    {(['rating','dimension1','dimension2','dimension3','dimension4'] as const).map((name,index) => <FormField key={name} control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{index === 0 ? 'Nota geral' : labels[index - 1]}</FormLabel><FormControl><select className="block rounded-lg border p-3" value={Number(field.value)} onChange={(event) => field.onChange(Number(event.target.value))}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} de 5</option>)}</select></FormControl><FormMessage /></FormItem>} />)}
    <button disabled={action.isPending} data-test="submit-review" className="bg-primary text-primary-foreground justify-self-start rounded-full px-6 py-3 disabled:opacity-50">{action.isPending ? 'Enviando…' : 'Enviar para moderação'}</button><p role="status" className="text-sm">{message}</p>
  </form></Form></details>;
}
