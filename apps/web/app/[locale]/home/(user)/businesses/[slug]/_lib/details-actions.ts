'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { DetailsSchema } from '~/lib/business/details-schema';

const split = (text: string) => text.split(',').map((item) => item.trim()).filter(Boolean);
export const saveDetailsAction = authActionClient.inputSchema(DetailsSchema).action(async ({ parsedInput: input, ctx: { user } }) => {
  const client = getSupabaseServerClient();
  const { data: current, error: readError } = await client.from('businesses').select('tier,social_links,address').eq('id', input.id).eq('account_id', user.id).maybeSingle();
  if (readError || !current) throw new Error('Empresa não encontrada.');
  if (input.vendor_business_id) {
    const { data: vendor } = await client.from('businesses').select('id').eq('id', input.vendor_business_id).eq('account_id', user.id).eq('offering_kind', 'service').maybeSingle();
    if (!vendor || input.vendor_business_id === input.id || input.offering_kind !== 'software') throw new Error('Fornecedor inválido.');
  }
  const paid = ['highlight', 'spotlight'].includes(current.tier);
  const socials = current.social_links && typeof current.social_links === 'object' && !Array.isArray(current.social_links) ? current.social_links : {};
  const address = current.address && typeof current.address === 'object' && !Array.isArray(current.address) ? current.address : {};
  const { error } = await client.from('businesses').update({
    offering_kind: input.offering_kind, vendor_business_id: input.vendor_business_id || null,
    features: split(input.features), integrations: split(input.integrations), clients: split(input.clients), sectors: split(input.sectors),
    team_story: input.team_story || null, team_photo_url: input.team_photo_url || null,
    pricing_model: input.pricing_model || null, deployment: split(input.deployment), support_languages: split(input.support_languages), buyer_sizes: split(input.buyer_sizes),
    social_links: { ...socials, linkedin: input.linkedin, instagram: input.instagram }, address: { ...address, description: input.address_text },
    free_trial: input.free_trial, free_plan: input.free_plan, portuguese: input.portuguese,
    ...(paid ? { video_url: input.video_url || null, calendar_url: input.calendar_url || null, cover_image_url: input.cover_image_url || null, custom_cta_url: input.custom_cta_url || null, custom_cta_label: input.custom_cta_label || null } : {}),
  }).eq('id', input.id).eq('account_id', user.id);
  if (error) throw new Error('Não foi possível salvar os detalhes.');
  revalidatePath(`/company/${input.slug}`); revalidatePath(`/home/businesses/${input.slug}`);
  return { success: true };
});
