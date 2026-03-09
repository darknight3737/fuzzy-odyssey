'use client';

import { useState, useTransition } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { removeMemberFromAccountAction } from '../../server/actions/team-members-server-actions';

export function RemoveMemberDialog({
  open,
  onOpenChange,
  teamAccountId,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamAccountId: string;
  userId: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans i18nKey="teams.removeMemberModalHeading" />
          </AlertDialogTitle>

          <AlertDialogDescription>
            <Trans i18nKey={'teams.removeMemberModalDescription'} />
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RemoveMemberForm
          accountId={teamAccountId}
          userId={userId}
          onSuccess={() => onOpenChange(false)}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RemoveMemberForm({
  accountId,
  userId,
  onSuccess,
}: {
  accountId: string;
  userId: string;
  onSuccess: () => void;
}) {
  const [isSubmitting, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const onMemberRemoved = () => {
    startTransition(async () => {
      try {
        await removeMemberFromAccountAction({ accountId, userId });
        onSuccess();
      } catch {
        setError(true);
      }
    });
  };

  return (
    <form action={onMemberRemoved}>
      <div className={'flex flex-col space-y-6'}>
        <p className={'text-muted-foreground text-sm'}>
          <Trans i18nKey={'common.modalConfirmationQuestion'} />
        </p>

        <If condition={error}>
          <RemoveMemberErrorAlert />
        </If>

        <AlertDialogFooter>
          <AlertDialogCancel>
            <Trans i18nKey={'common.cancel'} />
          </AlertDialogCancel>

          <Button
            data-test={'confirm-remove-member'}
            variant={'destructive'}
            disabled={isSubmitting}
          >
            <Trans i18nKey={'teams.removeMemberSubmitLabel'} />
          </Button>
        </AlertDialogFooter>
      </div>
    </form>
  );
}

function RemoveMemberErrorAlert() {
  return (
    <Alert variant={'destructive'}>
      <AlertTitle>
        <Trans i18nKey={'teams.removeMemberErrorHeading'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'teams.removeMemberErrorMessage'} />
      </AlertDescription>
    </Alert>
  );
}
