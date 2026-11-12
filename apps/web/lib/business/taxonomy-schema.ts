import { z } from 'zod';
export const TaxonomySchema = z.object({
  businessId: z.string().uuid(),
  slug: z.string().min(1),
  itemId: z.string().uuid(),
  kind: z.enum(['category', 'location']),
  selected: z.boolean(),
});
