import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

/**
 * Public bucket holding personal avatars and team logos. Storage policies in
 * `apps/web/supabase/schemas/16-storage.sql` key access off the file name.
 */
export const ACCOUNT_IMAGE_BUCKET = 'account_image';

/**
 * Account images are stored under the bare account id.
 */
export function getAccountImageFileName(accountId: string) {
  return accountId;
}

/**
 * @name getOwnedAccountIds
 * @description Ids of the accounts a user is the primary owner of: their
 * personal account and the teams they own. Deleting the user cascades to all
 * of them, so call this BEFORE deleting the user to clean up their images.
 */
export async function getOwnedAccountIds(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await client
    .from('accounts')
    .select('id')
    .eq('primary_owner_user_id', userId);

  const ids = data?.map((account) => account.id) ?? null;

  return {
    data: ids,
    error,
  };
}

/**
 * @name removeAccountImages
 * @description Remove the images of the given accounts. The bucket is public,
 * so an image stays fetchable after its account is deleted unless removed.
 * Also matches `{id}.{ext}`, the naming used by older kit versions.
 *
 * Never throws: account deletion has usually completed by the time this runs,
 * so callers log the returned error instead of failing the request.
 */
export async function removeAccountImages(
  client: SupabaseClient<Database>,
  accountIds: string[],
) {
  try {
    const bucket = client.storage.from(ACCOUNT_IMAGE_BUCKET);

    // the current naming is removed by name, so a failed listing never
    // blocks it; only older `{id}.{ext}` files need a listing to be found
    const legacy = await Promise.allSettled(
      accountIds.map((accountId) => listLegacyImageNames(client, accountId)),
    );

    const names = [
      ...accountIds,
      ...legacy.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : [],
      ),
    ];

    const listError =
      legacy.find((result) => {
        return result.status === 'rejected';
      })?.reason ?? null;

    if (!names.length) {
      return {
        error: listError,
      };
    }

    const { error } = await bucket.remove(names);

    return {
      error: error ?? listError,
    };
  } catch (error) {
    return {
      error,
    };
  }
}

const LIST_PAGE_SIZE = 100;
const LIST_MAX_PAGES = 10;

/**
 * Names of an account's `{id}.{ext}` files. Storage policies only check the
 * last path segment, so anyone can create root folders named `{id}.x/...` to
 * crowd the listing: page through it, skip folders, and stop at a cap so a
 * flooded prefix can't stall the deletion.
 */
async function listLegacyImageNames(
  client: SupabaseClient<Database>,
  accountId: string,
) {
  const bucket = client.storage.from(ACCOUNT_IMAGE_BUCKET);
  const prefix = `${accountId}.`;
  const names: string[] = [];

  for (let page = 0; page < LIST_MAX_PAGES; page++) {
    const { data, error } = await bucket.list('', {
      search: prefix,
      limit: LIST_PAGE_SIZE,
      offset: page * LIST_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    for (const file of data) {
      // folder entries have no id
      if (file.id !== null && file.name.startsWith(prefix)) {
        names.push(file.name);
      }
    }

    if (data.length < LIST_PAGE_SIZE) {
      break;
    }
  }

  return names;
}
