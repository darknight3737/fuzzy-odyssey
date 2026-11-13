'use server';
import { revalidatePath, updateTag } from 'next/cache';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { BusinessProfileSchema } from '~/lib/business/schema';
export const updateBusinessAction = authActionClient
  .inputSchema(BusinessProfileSchema)
  .action(async ({ parsedInput: { id, slug, ...data }, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const { data: business, error } = await client
      .from('businesses')
      .update(data)
      .eq('id', id)
      .eq('account_id', user.id)
      .select('id')
      .maybeSingle();
    if (error || !business)
      return {
        success: false,
        error:
          'Não foi possível salvar. Confira as informações e tente novamente.',
      };
    updateTag('directory');
    revalidatePath(`/company/${slug}`);
    revalidatePath('/[locale]/home/businesses/[slug]', 'layout');
    revalidatePath('/');
    return { success: true, error: '' };
  });
