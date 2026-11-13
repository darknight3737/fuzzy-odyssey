'use server';
import { revalidatePath } from 'next/cache';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ResponseSchema } from '~/lib/business/response-schema';
export const saveResponseAction = authActionClient
  .inputSchema(ResponseSchema)
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const { data: owner } = await client
      .from('businesses')
      .select('id,tier')
      .eq('id', input.businessId)
      .eq('account_id', user.id)
      .maybeSingle();
    if (!owner || !['verified', 'highlight', 'spotlight'].includes(owner.tier))
      throw new Error('Empresa não elegível.');
    const { data: review } = await client
      .from('reviews')
      .select('id')
      .eq('id', input.reviewId)
      .eq('business_id', input.businessId)
      .eq('status', 'approved')
      .maybeSingle();
    if (!review) throw new Error('Avaliação não encontrada.');
    const result = input.responseId
      ? await client
          .from('review_responses')
          .update({ response_text: input.response })
          .eq('id', input.responseId)
          .eq('review_id', input.reviewId)
      : await client.from('review_responses').insert({
          review_id: input.reviewId,
          user_id: user.id,
          response_text: input.response,
        });
    if (result.error) throw new Error('Não foi possível salvar a resposta.');
    revalidatePath(`/company/${input.slug}`);
    revalidatePath(`/home/businesses/${input.slug}`, 'layout');
    return { success: true };
  });
