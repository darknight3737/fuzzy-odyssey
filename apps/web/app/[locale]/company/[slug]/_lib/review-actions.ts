'use server';
import { z } from 'zod';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
export const submitReviewAction = authActionClient
  .inputSchema(
    z.object({
      businessId: z.string().uuid(),
      name: z.string().trim().min(2).max(100),
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(5).max(160),
      content: z.string().trim().min(30).max(5000),
    }),
  )
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const {
      data: { user: confirmed },
    } = await client.auth.getUser();
    if (!confirmed?.email_confirmed_at)
      return {
        success: false,
        error: 'Confirme seu e-mail antes de enviar uma avaliação.',
      };
    const { error } = await client.from('reviews').insert({
      business_id: data.businessId,
      user_id: user.id,
      reviewer_name: data.name,
      reviewer_email: confirmed.email ?? '',
      rating: data.rating,
      title: data.title,
      content: data.content,
      status: 'pending',
      is_verified: false,
    });
    return error
      ? {
          success: false,
          error:
            'Não foi possível enviar. Você não pode avaliar a própria empresa.',
        }
      : { success: true, error: '' };
  });
