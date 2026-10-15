import { z } from 'zod';

const optionalUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    try {
      return ['https:', 'http:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, 'Informe uma URL com https://');
export const BusinessProfileSchema = z.object({
  slug: z.string().min(1).max(200),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(10000),
  website: optionalUrl,
  email: z.string().email('E-mail inválido').or(z.literal('')),
  phone: z.string().max(40),
  logo_url: optionalUrl,
  employee_count: z
    .union([z.string(), z.number(), z.null()])
    .transform((value) =>
      value === '' || value === null ? null : Number(value),
    )
    .pipe(z.number().int().min(0).max(10000000).nullable()),
  founded_year: z
    .union([z.string(), z.number(), z.null()])
    .transform((value) =>
      value === '' || value === null ? null : Number(value),
    )
    .pipe(z.number().int().min(1800).max(new Date().getFullYear()).nullable()),
  works_remotely: z.boolean(),
});
export type BusinessProfileInput = z.infer<typeof BusinessProfileSchema>;

export type BusinessProfileFormValues = z.input<typeof BusinessProfileSchema>;
