import * as z from 'zod';

export const OfferingWebsiteSchema = z
  .string()
  .trim()
  .max(2048, 'offering.websiteInvalid')
  .transform((value) =>
    /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`,
  )
  .refine((value) => {
    if (
      value.length > 2048 ||
      !/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#]|$)/i.test(value) ||
      /[\\\s\p{Cc}]/u.test(value)
    )
      return false;

    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'offering.websiteInvalid');

// PostgreSQL accepts legacy identifiers with the UUID shape even when
// their version and variant bits do not satisfy RFC UUID validation.
const DatabaseId = z.guid();

export const OfferingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'offering.nameInvalid')
    .max(160, 'offering.nameInvalid'),
  website: OfferingWebsiteSchema,
  description: z
    .string()
    .trim()
    .min(30, 'offering.descriptionShort')
    .max(10000, 'offering.descriptionLong'),
  offering_kind: z.enum(['service', 'software']),
  vendor_business_id: DatabaseId.or(z.literal('')),
  category_ids: z
    .array(z.string())
    .min(1, 'offering.categoriesRequired')
    .max(10, 'offering.categoriesLimit')
    .refine(
      (ids) => ids.every((id) => DatabaseId.safeParse(id).success),
      'offering.categoriesInvalid',
    ),
});

export type OfferingInput = z.output<typeof OfferingSchema>;
