import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';

import * as z from 'zod';

import { getLogger } from '@kit/shared/logger';
import {
  getOwnedAccountIds,
  removeAccountImages,
} from '@kit/supabase/account-image';
import { Database } from '@kit/supabase/database';

export function createDeletePersonalAccountService() {
  return new DeletePersonalAccountService();
}

/**
 * @name DeletePersonalAccountService
 * @description Service for managing accounts in the application
 * @param Database - The Supabase database type to use
 * @example
 * const client = getSupabaseClient();
 * const accountsService = new DeletePersonalAccountService();
 */
class DeletePersonalAccountService {
  private namespace = 'accounts.delete';

  /**
   * @name deletePersonalAccount
   * Delete personal account of a user.
   * This will delete the user from the authentication provider and cancel all subscriptions.
   *
   * Permissions are not checked here, as they are checked in the server action.
   * USE WITH CAUTION. THE USER MUST HAVE THE NECESSARY PERMISSIONS.
   */
  async deletePersonalAccount(params: {
    adminClient: SupabaseClient<Database>;
    account: {
      id: string;
      email: string | null;
    };
  }) {
    const logger = await getLogger();

    const userId = params.account.id;
    const ctx = { userId, name: this.namespace };

    logger.info(
      ctx,
      'User requested to delete their personal account. Processing...',
    );

    // the user's teams cascade away with the user, so collect their ids
    // (and the personal account's) while the rows still exist
    const accountIds = await this.collectOwnedAccountIds(
      params.adminClient,
      userId,
    );

    // execute the deletion of the user
    try {
      const response = await params.adminClient.auth.admin.deleteUser(userId);

      if (response.error) {
        throw response.error;
      }

      logger.info(ctx, 'User successfully deleted!');

      // images live in a public bucket, so they stay fetchable unless
      // removed explicitly. Errors are handled in the method.
      await this.removeAccountImages(params.adminClient, userId, accountIds);

      if (params.account.email) {
        // dispatch the delete account email. Errors are handled in the method.
        await this.dispatchDeleteAccountEmail({
          email: params.account.email,
          id: params.account.id,
        });
      }

      return {
        success: true,
      };
    } catch (error) {
      logger.error(
        {
          ...ctx,
          error,
        },
        'Encountered an error deleting user',
      );

      throw new Error('Error deleting user', { cause: error });
    }
  }

  private async collectOwnedAccountIds(
    adminClient: SupabaseClient<Database>,
    userId: string,
  ) {
    const { data, error } = await getOwnedAccountIds(adminClient, userId);

    if (error) {
      const logger = await getLogger();

      logger.error(
        { name: this.namespace, userId, error },
        'Failed to list owned accounts. Only the personal image will be removed',
      );
    }

    return data ?? [userId];
  }

  private async removeAccountImages(
    adminClient: SupabaseClient<Database>,
    userId: string,
    accountIds: string[],
  ) {
    const { error } = await removeAccountImages(adminClient, accountIds);

    if (error) {
      const logger = await getLogger();

      logger.error(
        { name: this.namespace, userId, accountIds, error },
        'Failed to remove account images',
      );
    }
  }

  private async dispatchDeleteAccountEmail(account: {
    email: string;
    id: string;
  }) {
    const logger = await getLogger();
    const ctx = { name: this.namespace, userId: account.id };

    try {
      logger.info(ctx, 'Sending delete account email...');

      await this.sendDeleteAccountEmail(account);

      logger.info(ctx, 'Delete account email sent successfully');
    } catch (error) {
      logger.error(
        {
          ...ctx,
          error,
        },
        'Failed to send delete account email',
      );
    }
  }

  private async sendDeleteAccountEmail(account: { email: string }) {
    const emailSettings = this.getEmailSettings();

    const { renderAccountDeleteEmail } = await import('@kit/email-templates');
    const { getMailer } = await import('@kit/mailers');

    const mailer = await getMailer();

    const { html, subject } = await renderAccountDeleteEmail({
      productName: emailSettings.productName,
    });

    await mailer.sendEmail({
      from: emailSettings.fromEmail,
      html,
      subject,
      to: account.email,
    });
  }

  private getEmailSettings() {
    const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME;
    const fromEmail = process.env.EMAIL_SENDER;

    return z
      .object({
        productName: z
          .string({
            error: 'NEXT_PUBLIC_PRODUCT_NAME is required',
          })
          .min(1),
        fromEmail: z
          .string({
            error: 'EMAIL_SENDER is required',
          })
          .min(1),
      })
      .parse({
        productName,
        fromEmail,
      });
  }
}
