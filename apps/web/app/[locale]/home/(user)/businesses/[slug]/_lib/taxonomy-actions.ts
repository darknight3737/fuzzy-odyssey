'use server';
import { revalidatePath } from 'next/cache';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { taxonomyKind } from '~/lib/directory/taxonomy';
import { TaxonomySchema } from '~/lib/business/taxonomy-schema';
export const toggleTaxonomyAction = authActionClient
  .inputSchema(TaxonomySchema)
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const { data: owner } = await client
      .from('businesses')
      .select('id,offering_kind')
      .eq('id', input.businessId)
      .eq('account_id', user.id)
      .maybeSingle();
    if (!owner) throw new Error('Empresa não encontrada.');
    let error;
    if (input.kind === 'category') {
      if (input.selected) {
        const { data: category, error } = await client
          .from('categories')
          .select('slug')
          .eq('id', input.itemId)
          .eq('is_active', true)
          .maybeSingle();
        if (
          error ||
          !category ||
          taxonomyKind(category.slug) !== owner.offering_kind
        ) {
          throw new Error('Escolha uma categoria do mesmo tipo da oferta.');
        }
      }
      const result = input.selected
        ? await client.from('business_categories').insert({
            business_id: input.businessId,
            category_id: input.itemId,
          })
        : await client
            .from('business_categories')
            .delete()
            .eq('business_id', input.businessId)
            .eq('category_id', input.itemId);
      error = result.error;
    } else {
      const result = input.selected
        ? await client.from('business_locations').insert({
            business_id: input.businessId,
            location_id: input.itemId,
          })
        : await client
            .from('business_locations')
            .delete()
            .eq('business_id', input.businessId)
            .eq('location_id', input.itemId);
      error = result.error;
    }
    if (error) throw new Error('Não foi possível atualizar.');
    revalidatePath(`/company/${input.slug}`);
    revalidatePath(`/home/businesses/${input.slug}`, 'layout');
    return { success: true };
  });
