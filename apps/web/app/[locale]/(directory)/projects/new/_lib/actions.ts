'use server';
import { redirect } from 'next/navigation';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { taxonomyKind } from '~/lib/directory/taxonomy';
import { LeadSchema } from '~/lib/leads/schema';
import { createLeadService } from '~/lib/leads/service';
export const submitLeadAction = authActionClient
  .inputSchema(LeadSchema)
  .action(async ({ parsedInput }) => {
    const client = getSupabaseServerClient();
    if (parsedInput.category_id) {
      const { data: category, error } = await client
        .from('categories')
        .select('slug')
        .eq('id', parsedInput.category_id)
        .eq('is_active', true)
        .maybeSingle();
      if (
        error ||
        !category ||
        taxonomyKind(category.slug) !== parsedInput.offering_kind
      ) {
        throw new Error('Escolha uma categoria do mesmo tipo da solução.');
      }
    }
    await createLeadService(client).create(parsedInput);
    redirect('/home/leads');
  });
