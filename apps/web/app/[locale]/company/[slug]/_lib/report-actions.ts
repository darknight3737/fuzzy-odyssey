'use server';
import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ReportSchema } from './report-schema';
export const reportReviewAction = authActionClient
  .inputSchema(ReportSchema)
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const { error } = await client
      .from('review_reports')
      .insert({
        review_id: input.reviewId,
        reporter_id: user.id,
        reason: input.reason,
      });
    if (error) throw new Error('Não foi possível enviar a denúncia.');
    return { success: true };
  });
