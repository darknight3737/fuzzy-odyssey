'use client';

import { TriangleAlert } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

export function InvalidOtpAlert(props: { onRequestNewCode: () => void }) {
  return (
    <Alert variant={'destructive'} data-test={'invalid-otp-alert'}>
      <TriangleAlert className={'h-4'} />

      <AlertTitle>
        <Trans i18nKey={'common.otp.invalidCodeHeading'} />
      </AlertTitle>

      <AlertDescription className={'flex flex-col items-start gap-y-2'}>
        <Trans i18nKey={'common.otp.invalidCodeDescription'} />

        <Button
          type={'button'}
          size={'sm'}
          variant={'outline'}
          data-test={'invalid-otp-request-new-code'}
          onClick={props.onRequestNewCode}
        >
          <Trans i18nKey={'common.otp.requestNewCode'} />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
