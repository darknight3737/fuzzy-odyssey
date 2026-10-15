'use server';

import { authActionClient } from '@kit/next/safe-action';
import { verifyOtpForPurpose } from '@kit/otp/orchestration';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { DeletePersonalAccountSchema } from '../schema/delete-personal-account.schema';
import { createDeletePersonalAccountService } from './services/delete-personal-account.service';

const enableAccountDeletion =
  process.env.NEXT_PUBLIC_ENABLE_PERSONAL_ACCOUNT_DELETION === 'true';

export async function refreshAuthSession() {
  const client = getSupabaseServerClient();

  await client.auth.refreshSession();

  return {};
}

export const deletePersonalAccountAction = authActionClient
  .inputSchema(DeletePersonalAccountSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const logger = await getLogger();

    const ctx = {
      name: 'account.delete',
      userId: user.id,
    };

    const otp = data.otp;

    if (!otp) {
      throw new Error('OTP is required');
    }

    if (!enableAccountDeletion) {
      logger.warn(ctx, `Account deletion is not enabled`);

      throw new Error('Account deletion is not enabled');
    }

    logger.info(ctx, `Deleting account...`);

    // verify the OTP
    const client = getSupabaseServerClient();

    await verifyOtpForPurpose({
      client,
      logger,
      ctx,
      userId: user.id,
      token: otp,
      purpose: 'delete-personal-account',
      logMismatch: true,
      // failed attempts are now counted (see verify_nonce); allow a few honest
      // retries while still bounding brute-force attempts
      maxVerificationAttempts: 5,
    });

    // create a new instance of the personal accounts service
    const service = createDeletePersonalAccountService();

    // delete the user's account and cancel all subscriptions
    await service.deletePersonalAccount({
      adminClient: getSupabaseServerAdminClient(),
      account: {
        id: user.id,
        email: user.email ?? null,
      },
    });

    // sign out the user after deleting their account
    await client.auth.signOut();

    logger.info(ctx, `Account request successfully sent`);

    // the client performs a full page load on success: a server redirect is a
    // soft navigation that keeps the browser's cached user, so the header
    // would still render the account as signed in. No revalidatePath either:
    // it would refresh the current (now unauthenticated) route and race the
    // client's reload with a redirect to sign-in.
    return { success: true };
  });
