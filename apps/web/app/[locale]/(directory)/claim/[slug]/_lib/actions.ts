'use server';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { z } from 'zod';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
export const claimBusinessAction = authActionClient
  .inputSchema(
    z.object({
      slug: z
        .string()
        .min(1)
        .max(200)
        .regex(/^[a-z0-9-]+$/),
    }),
  )
  .action(async ({ parsedInput: { slug } }) => {
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
    updateTag('directory');
    revalidatePath(`/company/${slug}`);
    revalidatePath('/home');
    redirect(`/home/businesses/${slug}`);
  });
