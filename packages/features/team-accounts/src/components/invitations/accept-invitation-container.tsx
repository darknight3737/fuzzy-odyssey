'use client';

import Image from 'next/image';

import { useAction } from 'next-safe-action/hooks';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { If } from '@kit/ui/if';
import { Separator } from '@kit/ui/separator';
import { Trans } from '@kit/ui/trans';

import { acceptInvitationAction } from '../../server/actions/team-invitations-server-actions';
import { SignOutInvitationButton } from './sign-out-invitation-button';

export function AcceptInvitationContainer(props: {
  inviteToken: string;
  email: string;

  invitation: {
    id: string;

    account: {
      name: string;
      id: string;
      picture_url: string | null;
    };
  };

  paths: {
    signOutNext: string;
    nextPath: string;
  };
}) {
  const { execute, isPending, result } = useAction(acceptInvitationAction);

  // On success the action redirects, so a settled result can only mean failure.
  // Without this the button would simply reset and the invitee would be left
  // clicking it forever with no indication that anything went wrong.
  const hasError =
    result.serverError !== undefined || result.validationErrors !== undefined;

  return (
    <div className={'flex flex-col items-center space-y-4'}>
      <Heading className={'text-center'} level={4}>
        <Trans
          i18nKey={'teams.acceptInvitationHeading'}
          values={{
            accountName: props.invitation.account.name,
          }}
        />
      </Heading>

      <If condition={props.invitation.account.picture_url}>
        {(url) => (
          <Image
            alt={`Logo`}
            src={url}
            width={64}
            height={64}
            className={'object-cover'}
          />
        )}
      </If>

      <div className={'text-muted-foreground text-center text-sm'}>
        <Trans
          i18nKey={'teams.acceptInvitationDescription'}
          values={{
            accountName: props.invitation.account.name,
          }}
        />
      </div>

      <div className={'flex w-full flex-col space-y-4'}>
        <If condition={hasError}>
          <Alert variant={'destructive'} data-test={'accept-invitation-error'}>
            <AlertTitle>
              <Trans i18nKey={'teams.acceptInvitationErrorTitle'} />
            </AlertTitle>

            <AlertDescription>
              <Trans i18nKey={'teams.acceptInvitationErrorDescription'} />
            </AlertDescription>
          </Alert>
        </If>

        <form
          data-test={'join-team-form'}
          className={'w-full'}
          onSubmit={(e) => {
            e.preventDefault();

            execute({
              inviteToken: props.inviteToken,
              nextPath: props.paths.nextPath,
            });
          }}
        >
          <Button type={'submit'} className={'w-full'} disabled={isPending}>
            <Trans
              i18nKey={isPending ? 'teams.joiningTeam' : 'teams.continueAs'}
              values={{
                accountName: props.invitation.account.name,
                email: props.email,
              }}
            />
          </Button>
        </form>

        <Separator />

        <SignOutInvitationButton nextPath={props.paths.signOutNext} />

        <span className={'text-muted-foreground text-center text-xs'}>
          <Trans i18nKey={'teams.signInWithDifferentAccountDescription'} />
        </span>
      </div>
    </div>
  );
}
