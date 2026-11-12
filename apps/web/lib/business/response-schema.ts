import { z } from 'zod';
export const ResponseSchema = z.object({ businessId: z.string().uuid(), slug: z.string().min(1), reviewId: z.string().uuid(), responseId: z.string().uuid().optional(), response: z.string().trim().min(2).max(5000) });
