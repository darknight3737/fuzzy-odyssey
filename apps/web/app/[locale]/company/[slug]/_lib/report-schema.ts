import { z } from 'zod';
export const ReportSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.string().trim().min(10).max(2000),
});
