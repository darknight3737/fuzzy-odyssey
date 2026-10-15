'use client';

import { useState, useTransition } from 'react';

import { submitReviewAction } from '../_lib/review-actions';

export function ReviewForm({ businessId }: { businessId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <p role="status" className="rounded-xl border p-6">
        Obrigado! Sua avaliação foi enviada para moderação e aparecerá após a
        aprovação.
      </p>
    );
  return (
    <details className="mt-6 rounded-xl border p-6">
      <summary className="cursor-pointer font-medium">
        Compartilhar minha experiência
      </summary>
      <p className="text-muted-foreground my-4 text-sm">
        Entre na sua conta para enviar uma avaliação. Todas as avaliações passam
        por moderação.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(async () => {
            setMessage('');
            try {
              const result = await submitReviewAction({
                businessId,
                name: String(data.get('name')),
                rating: Number(data.get('rating')),
                title: String(data.get('title')),
                content: String(data.get('content')),
              });
              if (result.success) setSent(true);
              else setMessage(result.error);
            } catch {
              setMessage(
                'Não foi possível enviar. Confira os campos e tente novamente.',
              );
            }
          });
        }}
        className="grid gap-4"
      >
        <label className="text-sm">
          Seu nome
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            className="mt-2 block w-full rounded-lg border p-3"
          />
        </label>
        <label className="text-sm">
          Nota
          <select
            name="rating"
            className="mt-2 block rounded-lg border p-3"
            defaultValue="5"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} de 5
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Título
          <input
            name="title"
            required
            minLength={5}
            maxLength={160}
            className="mt-2 block w-full rounded-lg border p-3"
          />
        </label>
        <label className="text-sm">
          Sua experiência
          <textarea
            name="content"
            required
            minLength={30}
            maxLength={5000}
            rows={5}
            className="mt-2 block w-full rounded-lg border p-3"
          />
        </label>
        <button
          disabled={pending}
          data-test="submit-review"
          className="bg-primary text-primary-foreground justify-self-start rounded-full px-6 py-3 text-sm disabled:opacity-50"
        >
          {pending ? 'Enviando…' : 'Enviar para moderação'}
        </button>
        <p role="alert" className="text-destructive text-sm">
          {message}
        </p>
      </form>
    </details>
  );
}
