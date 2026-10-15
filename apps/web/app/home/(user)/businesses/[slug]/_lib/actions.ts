'use server';

import { revalidatePath } from 'next/cache';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { BusinessProfileSchema } from '~/lib/business/schema';

export const updateBusinessAction = enhanceAction(
  async ({ slug, ...data }, user) => {
    const client = getSupabaseServerClient();
    const { data: business, error } = await client
      .from('businesses')
      .update(data)
      .eq('slug', slug)
      .eq('account_id', user.id)
      .select('id')
      .maybeSingle();
    if (error || !business)
      return {
        success: false,
        error:
          'Não foi possível salvar. Confira as informações e tente novamente.',
      };
    revalidatePath(`/company/${slug}`);
    revalidatePath(`/home/businesses/${slug}`);
    revalidatePath('/');
    return { success: true, error: '' };
  },
  { auth: true, schema: BusinessProfileSchema },
);
