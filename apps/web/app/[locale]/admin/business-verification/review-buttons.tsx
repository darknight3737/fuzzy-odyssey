'use client';
import { useAction } from 'next-safe-action/hooks';

import { Button } from '@kit/ui/button';

import { reviewBusinessVerification } from '~/lib/business-verification/actions';

export function ReviewButtons({ id }: { id: string }) {
  const action = useAction(reviewBusinessVerification);
  const error = action.result.data?.error ?? action.result.serverError;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={action.isPending}
          data-test="verification-support-approve"
          onClick={() => action.execute({ id, approve: true })}
        >
          Confirmar vínculo
        </Button>
        <Button
          variant="outline"
          disabled={action.isPending}
          data-test="verification-support-reject"
          onClick={() => action.execute({ id, approve: false })}
        >
          Recusar pedido
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
