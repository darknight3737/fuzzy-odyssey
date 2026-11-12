import { z } from 'zod';
export const OfferingSchema = z.object({
  name: z.string().trim().min(2).max(160),
  website: z
    .url()
    .refine((v) => new URL(v).protocol === 'https:', 'Use HTTPS.'),
  description: z.string().trim().min(30).max(10000),
  offering_kind: z.enum(['service', 'software']),
  vendor_business_id: z.uuid().or(z.literal('')),
  category_ids: z.array(z.uuid()).min(1).max(10),
});
