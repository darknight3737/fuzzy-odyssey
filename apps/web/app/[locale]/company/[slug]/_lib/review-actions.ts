'use server';
import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ReviewSchema } from './review-schema';
export const submitReviewAction = authActionClient
  .inputSchema(ReviewSchema)
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
    const { data: business } = await client
      .from('businesses')
      .select('offering_kind,tier')
      .eq('id', data.businessId)
      .maybeSingle();
    if (
      !business ||
      !['verified', 'highlight', 'spotlight'].includes(business.tier)
    )
      throw new Error('Esta empresa não recebe novas avaliações.');
    const labels =
      business.offering_kind === 'software'
        ? ['Facilidade de uso', 'Funcionalidades', 'Suporte', 'Custo-benefício']
        : ['Qualidade', 'Orçamento', 'Prazo', 'Colaboração'];
    const dimensions = Object.fromEntries(
      [data.dimension1, data.dimension2, data.dimension3, data.dimension4].map(
        (value, index) => [labels[index]!, value],
      ),
    );
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
      dimensions,
    });
    return error
      ? {
          success: false,
          error:
            'Não foi possível enviar. Você não pode avaliar a própria empresa.',
        }
      : { success: true, error: '' };
  });
