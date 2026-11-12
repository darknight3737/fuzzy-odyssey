import { z } from 'zod';
export const GallerySchema = z.object({ businessId: z.string().uuid(), slug: z.string().min(1), id: z.string().uuid().optional(), image_url: z.string().url().max(2048).refine((value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } }, 'Use uma URL HTTPS.'), caption: z.string().max(500) });
export const DeleteGallerySchema = GallerySchema.pick({ businessId: true, slug: true }).extend({ id: z.string().uuid() });
