'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export const claimBusinessAction = enhanceAction(
  async ({ slug }) => {
    const client = getSupabaseServerClient();
    const { error } = await client.rpc('claim_business', {
      business_slug: slug,
    });
    if (error)
      return {
        success: false,
        error:
          'Não foi possível reivindicar. Confirme seu e-mail corporativo e verifique se o domínio é igual ao do site cadastrado. O perfil também pode ter sido reivindicado por outra pessoa.',
      };
    revalidatePath(`/company/${slug}`);
    revalidatePath('/home');
    return { success: true, error: '' };
  },
  {
    auth: true,
    schema: z.object({
      slug: z
        .string()
        .min(1)
        .max(200)
        .regex(/^[a-z0-9-]+$/),
    }),
  },
);
