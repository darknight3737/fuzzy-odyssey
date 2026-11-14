'use client';
import { useAction } from 'next-safe-action/hooks';

import { startBusinessVerification } from '~/lib/business-verification/actions';

export function BusinessVerificationButton({
  slug,
  label = 'Escolher como confirmar vínculo',
}: {
  slug: string;
  label?: string;
}) {
  const { execute, isPending, result } = useAction(startBusinessVerification);
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
        {isPending ? 'Carregando…' : label}
      </button>
      {error && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {error}
        </p>
      )}
    </>
  );
}
