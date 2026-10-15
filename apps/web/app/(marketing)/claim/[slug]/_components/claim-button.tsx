'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { claimBusinessAction } from '../_lib/actions';

export function ClaimButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();
  return (
    <>
      <button
        data-test="claim-business"
        disabled={pending}
        className="bg-primary text-primary-foreground rounded-full px-6 py-3 disabled:opacity-50"
        onClick={() =>
          startTransition(async () => {
            setError('');
            try {
              const result = await claimBusinessAction({ slug });
              if (result.success) router.push(`/home/businesses/${slug}`);
              else setError(result.error);
            } catch {
              setError('Não foi possível concluir. Tente novamente.');
            }
          })
        }
      >
        {pending ? 'Verificando…' : 'Reivindicar perfil gratuitamente'}
      </button>
      {error && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {error}
        </p>
      )}
    </>
  );
}
