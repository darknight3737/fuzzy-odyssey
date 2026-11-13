'use server';
import { revalidatePath } from 'next/cache';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  GallerySchema,
  DeleteGallerySchema,
} from '~/lib/business/gallery-schema';

export const saveGalleryAction = authActionClient
  .inputSchema(GallerySchema)
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const { data: owner } = await client
      .from('businesses')
      .select('id')
      .eq('id', input.businessId)
      .eq('account_id', user.id)
      .maybeSingle();
    if (!owner) throw new Error('Empresa não encontrada.');
    const values = { image_url: input.image_url, caption: input.caption };
    const result = input.id
      ? await client
          .from('business_gallery')
          .update(values)
          .eq('id', input.id)
          .eq('business_id', input.businessId)
      : await client
          .from('business_gallery')
          .insert({ ...values, business_id: input.businessId });
    if (result.error) throw new Error('Não foi possível salvar a imagem.');
    revalidatePath(`/company/${input.slug}`);
    revalidatePath(`/home/businesses/${input.slug}`, 'layout');
    return { success: true };
  });
export const deleteGalleryAction = authActionClient
  .inputSchema(DeleteGallerySchema)
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const { data: owner } = await client
      .from('businesses')
      .select('id')
      .eq('id', input.businessId)
      .eq('account_id', user.id)
      .maybeSingle();
    if (!owner) throw new Error('Empresa não encontrada.');
    const { error } = await client
      .from('business_gallery')
      .delete()
      .eq('id', input.id)
      .eq('business_id', input.businessId);
    if (error) throw new Error('Não foi possível excluir a imagem.');
    revalidatePath(`/company/${input.slug}`);
    revalidatePath(`/home/businesses/${input.slug}`, 'layout');
    return { success: true };
  });
