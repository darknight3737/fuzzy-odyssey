import { z } from 'zod';

const url = z.string().max(2000).refine((value) => {
  if (!value) return true;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}, 'Informe uma URL https válida.');

export const DetailsSchema = z.object({
  id: z.string().uuid(), slug: z.string().min(1),
  offering_kind: z.enum(['service', 'software']), vendor_business_id: z.string().uuid().or(z.literal('')), 
  features: z.string().max(5000), integrations: z.string().max(5000),
  clients: z.string().max(5000), sectors: z.string().max(5000),
  team_story: z.string().max(10000), team_photo_url: url,
  pricing_model: z.string().max(5000), deployment: z.string().max(5000), support_languages: z.string().max(5000), buyer_sizes: z.string().max(5000),
  linkedin: url, instagram: url, address_text: z.string().max(2000),
  video_url: url, calendar_url: url, cover_image_url: url, custom_cta_url: url, custom_cta_label: z.string().max(100),
  free_trial: z.boolean(), free_plan: z.boolean(), portuguese: z.boolean(),
});
