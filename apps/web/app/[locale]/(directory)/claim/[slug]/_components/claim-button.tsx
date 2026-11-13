'use client';
import { useAction } from 'next-safe-action/hooks';

import { claimBusinessAction } from '../_lib/actions';

export function ClaimButton({ slug }: { slug: string }) {
  const { execute, isPending, result } = useAction(claimBusinessAction);
  const error =
    result.data?.error ||
    (result.serverError || result.validationErrors
      ? 'Não foi possível concluir. Confira os dados e tente novamente.'
      : '');
  return (
    <>
      <button
        data-test="claim-business"
        disabled={isPending}
        className="inline-flex min-h-12 items-center rounded-lg bg-[#004038] px-6 text-[15px] font-semibold text-white hover:bg-[#00544c] disabled:opacity-50"
        onClick={() => execute({ slug })}
      >
        {isPending ? 'Verificando…' : 'Reivindicar perfil gratuitamente'}
      </button>
      {error && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {error}
        </p>
      )}
    </>
  );
}
