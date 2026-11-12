import { z } from 'zod';

export const ContentSchema = z.object({
  businessId: z.string().uuid(),
  slug: z.string().min(1).max(200),
  id: z.string().uuid().optional(),
  kind: z.enum(['service', 'case', 'award']),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(10000),
  detail: z.string().trim().max(160),
  challenge: z.string().trim().max(10000),
  solution: z.string().trim().max(10000),
  results: z.string().trim().max(10000),
  industry: z.string().trim().max(160), project_type: z.string().trim().max(160), duration: z.string().trim().max(160), budget_range: z.string().trim().max(160),
  images: z.string().max(10000).refine((value) => value.split(',').every((item) => { if (!item.trim()) return true; try { return new URL(item.trim()).protocol === 'https:'; } catch { return false; } }), 'Use URLs HTTPS separadas por vírgula.'),
});
export const DeleteContentSchema = ContentSchema.pick({ businessId: true, slug: true, id: true, kind: true }).extend({ id: z.string().uuid() });
