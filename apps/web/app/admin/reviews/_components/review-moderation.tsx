'use client';

import { useState, useTransition } from 'react';

import { moderateReviewAction } from '../_lib/actions';

export function ReviewModeration({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  return (
    <div>
      <div className="flex gap-3">
        {(['approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            disabled={pending}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
            onClick={() =>
              startTransition(async () => {
                try {
                  const result = await moderateReviewAction({ id, status });
                  setMessage(
                    result?.data?.success
                      ? 'Moderação salva.'
                      : 'Não foi possível salvar.',
                  );
                } catch {
                  setMessage('Sem permissão ou sessão expirada.');
                }
              })
            }
          >
            {status === 'approved' ? 'Aprovar' : 'Rejeitar'}
          </button>
        ))}
      </div>
      <p role="status" className="mt-3 text-sm">
        {message}
      </p>
    </div>
  );
}
