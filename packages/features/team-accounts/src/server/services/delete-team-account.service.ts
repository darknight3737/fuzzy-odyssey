import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';

import { getLogger } from '@kit/shared/logger';
import { removeAccountImages } from '@kit/supabase/account-image';
import { Database } from '@kit/supabase/database';

export function createDeleteTeamAccountService() {
  return new DeleteTeamAccountService();
}

class DeleteTeamAccountService {
  private readonly namespace = 'accounts.delete-team-account';

  /**
   * Deletes a team account and its logo. Permissions are not checked here, as
   * they are checked in the server action.
   *
   * USE WITH CAUTION. THE USER MUST HAVE THE NECESSARY PERMISSIONS.
   *
   * @param clients.client - user client: the delete runs under RLS
   * @param clients.adminClient - removes the logo once the team is gone, when
   * the storage policy no longer grants the user access to its file
   * @param params
   */
  async deleteTeamAccount(
    clients: {
      client: SupabaseClient<Database>;
      adminClient: SupabaseClient<Database>;
    },
    params: {
      accountId: string;
      userId: string;
    },
  ) {
    const logger = await getLogger();

    const ctx = {
      accountId: params.accountId,
      userId: params.userId,
      name: this.namespace,
    };

    logger.info(ctx, `Requested team account deletion. Processing...`);

    // RLS filters out rows the user may not delete (e.g. a personal account)
    // without raising an error, so check a row was actually deleted
    const { data, error } = await clients.client
      .from('accounts')
      .delete()
      .eq('id', params.accountId)
      .select('id');

    if (error ?? !data.length) {
      logger.error(
        {
          ...ctx,
          error,
        },
        'Failed to delete team account',
      );

      throw new Error('Failed to delete team account');
    }

    logger.info(ctx, 'Successfully deleted team account');

    // the logo lives in a public bucket, so it stays fetchable unless removed
    const { error: imageError } = await removeAccountImages(
      clients.adminClient,
      [params.accountId],
    );

    if (imageError) {
      logger.error(
        { ...ctx, error: imageError },
        'Failed to remove team account image',
      );
    }
  }
}
