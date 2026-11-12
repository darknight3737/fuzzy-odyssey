import { z } from 'zod';
export const ReviewSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(5).max(160),
  content: z.string().trim().min(30).max(5000),
  dimension1: z.coerce.number().int().min(1).max(5),
  dimension2: z.coerce.number().int().min(1).max(5),
  dimension3: z.coerce.number().int().min(1).max(5),
  dimension4: z.coerce.number().int().min(1).max(5),
});
