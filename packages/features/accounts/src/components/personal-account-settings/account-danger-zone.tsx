'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlert } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm, useWatch } from 'react-hook-form';

import { ErrorBoundary } from '@kit/monitoring/components';
import {
  InvalidOtpAlert,
  VerifyOtpForm,
  isInvalidOtpError,
} from '@kit/otp/components';
import { useUser } from '@kit/supabase/hooks/use-user';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';
import { Form } from '@kit/ui/form';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { DeletePersonalAccountSchema } from '../../schema/delete-personal-account.schema';
import { deletePersonalAccountAction } from '../../server/personal-accounts-server-actions';

export function AccountDangerZone() {
  return (
    <div className={'flex flex-col space-y-4'}>
      <div className={'flex flex-col space-y-1'}>
        <span className={'text-sm font-medium'}>
          <Trans i18nKey={'account.deleteAccount'} />
        </span>

        <p className={'text-muted-foreground text-sm'}>
          <Trans i18nKey={'account.deleteAccountDescription'} />
        </p>
      </div>

      <div>
        <DeleteAccountModal />
      </div>
    </div>
  );
}

function DeleteAccountModal() {
  const { data: user } = useUser();

  if (!user?.email) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button data-test={'delete-account-button'} variant={'destructive'}>
            <Trans i18nKey={'account.deleteAccount'} />
          </Button>
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans i18nKey={'account.deleteAccount'} />
          </AlertDialogTitle>
        </AlertDialogHeader>

        <ErrorBoundary fallback={<DeleteAccountErrorContainer />}>
          <DeleteAccountForm email={user.email} />
        </ErrorBoundary>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteAccountForm(props: { email: string }) {
  const { execute, reset, result, isPending, hasSucceeded, hasErrored } =
    useAction(deletePersonalAccountAction, {
      // full page load to drop the client-side auth state (cached user, browser
      // Supabase session) now that the server session is gone
      onSuccess: () => window.location.assign('/'),
    });

  const form = useForm({
    resolver: zodResolver(DeletePersonalAccountSchema),
    defaultValues: {
      otp: '',
    },
  });

  const { otp } = useWatch({ control: form.control });

  const isInvalidOtp = isInvalidOtpError(result.serverError);

  if (!otp) {
    return (
      <VerifyOtpForm
        purpose={'delete-personal-account'}
        email={props.email}
        onSuccess={(otp) => form.setValue('otp', otp, { shouldValidate: true })}
        CancelButton={
          <AlertDialogCancel>
            <Trans i18nKey={'common.cancel'} />
          </AlertDialogCancel>
        }
      />
    );
  }

  return (
    <Form {...form}>
      <form
        data-test={'delete-account-form'}
        onSubmit={(e) => {
          e.preventDefault();
          execute({ otp });
        }}
        className={'flex flex-col space-y-4'}
      >
        <div className={'flex flex-col space-y-6'}>
          <If condition={hasErrored}>
            {isInvalidOtp ? (
              <InvalidOtpAlert
                onRequestNewCode={() => {
                  reset();
                  form.reset();
                }}
              />
            ) : (
              <DeleteAccountErrorAlert />
            )}
          </If>

          <div
            className={
              'border-destructive text-destructive rounded-md border p-4 text-sm'
            }
          >
            <div className={'flex flex-col space-y-2'}>
              <div>
                <Trans i18nKey={'account.deleteAccountDescription'} />
              </div>

              <div>
                <Trans i18nKey={'common.modalConfirmationQuestion'} />
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            <Trans i18nKey={'common.cancel'} />
          </AlertDialogCancel>

          <Button
            data-test={'confirm-delete-account-button'}
            type={'submit'}
            disabled={
              isPending ||
              hasSucceeded ||
              isInvalidOtp ||
              !form.formState.isValid
            }
            name={'action'}
            variant={'destructive'}
          >
            {isPending || hasSucceeded ? (
              <Trans i18nKey={'account.deletingAccount'} />
            ) : (
              <Trans i18nKey={'account.deleteAccount'} />
            )}
          </Button>
        </AlertDialogFooter>
      </form>
    </Form>
  );
}

function DeleteAccountErrorContainer() {
  return (
    <div className="flex flex-col gap-y-4">
      <DeleteAccountErrorAlert />

      <div>
        <AlertDialogCancel>
          <Trans i18nKey={'common.cancel'} />
        </AlertDialogCancel>
      </div>
    </div>
  );
}

function DeleteAccountErrorAlert() {
  return (
    <Alert variant={'destructive'}>
      <TriangleAlert className={'h-4'} />

      <AlertTitle>
        <Trans i18nKey={'account.deleteAccountErrorHeading'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'common.genericError'} />
      </AlertDescription>
    </Alert>
  );
}
