'use client';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@kit/ui/form';
import { ReportSchema } from '../_lib/report-schema';
import { reportReviewAction } from '../_lib/report-actions';
export function ReportReview({ reviewId }: { reviewId: string }) {
  const [message, setMessage] = useState('');
  const form = useForm({ resolver: zodResolver(ReportSchema), defaultValues: { reviewId, reason: '' } });
  const action = useAction(reportReviewAction, { onSuccess: () => setMessage('Denúncia enviada para análise.'), onError: () => setMessage('Não foi possível enviar. Entre na sua conta ou confira se já denunciou esta avaliação.') });
  return <details className="mt-4 text-sm"><summary className="cursor-pointer underline">Denunciar avaliação</summary><Form {...form}><form onSubmit={form.handleSubmit(action.execute)} className="mt-3 space-y-3"><FormField control={form.control} name="reason" render={({ field }) => <FormItem><FormLabel>Por que esta avaliação deve ser analisada?</FormLabel><FormControl><textarea className="w-full rounded-lg border p-3" rows={3} {...field} /></FormControl><FormMessage /></FormItem>} /><button disabled={action.isPending} className="rounded-full border px-4 py-2">Enviar denúncia</button><p role="status">{message}</p></form></Form></details>;
}
