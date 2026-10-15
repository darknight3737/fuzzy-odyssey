import { z } from 'zod/v3';

export const ComponentCategorySchema = z.enum([
  'shadcn',
  'makerkit',
  'base-ui',
  'hooks',
  'utils',
]);

export const CvaVariantGroupSchema = z.object({
  name: z.string(),
  variants: z.record(z.array(z.string())),
  defaults: z.record(z.string()),
});

export const ComponentDetailsSchema = z.object({
  exports: z.array(z.string()),
  reexports: z.array(z.string()),
  client_component: z.boolean(),
  supports_render_prop: z.boolean(),
  variants: z.array(CvaVariantGroupSchema),
});

export const ComponentSummarySchema = z.object({
  name: z.string(),
  import: z.string(),
  export_path: z.string(),
  file_path: z.string(),
  category: ComponentCategorySchema,
  description: z.string(),
  exists: z.boolean(),
  details: ComponentDetailsSchema.optional(),
  /** Present when the file exists but could not be read or parsed. */
  details_error: z.string().optional(),
});

export const GetComponentsInputSchema = z.object({
  state: z
    .object({
      category: ComponentCategorySchema.optional(),
      includeDetails: z.boolean().default(false),
    })
    .optional(),
});

export const GetComponentsOutputSchema = z.object({
  total: z.number().int().min(0),
  counts_by_category: z.record(z.number().int().min(0)),
  broken_exports: z.array(z.string()),
  components: z.array(ComponentSummarySchema),
});

export const ComponentsSearchInputSchema = z.object({
  state: z.object({
    query: z.string().min(1),
    category: ComponentCategorySchema.optional(),
    limit: z.number().int().min(1).max(200).default(50),
  }),
});

export const ComponentsSearchOutputSchema = z.object({
  query: z.string(),
  total: z.number().int().min(0),
  components: z.array(ComponentSummarySchema),
});

export const GetComponentContentInputSchema = z.object({
  state: z.object({
    componentName: z.string().min(1),
  }),
});

export const GetComponentContentOutputSchema = z.object({
  name: z.string(),
  import: z.string(),
  file_path: z.string(),
  category: ComponentCategorySchema,
  description: z.string(),
  client_component: z.boolean(),
  content: z.string(),
});

export const GetComponentPropsInputSchema = z.object({
  state: z.object({
    componentName: z.string().min(1),
  }),
});

export const GetComponentPropsOutputSchema = z.object({
  name: z.string(),
  import: z.string(),
  file_path: z.string(),
  category: ComponentCategorySchema,
  description: z.string(),
  client_component: z.boolean(),
  supports_render_prop: z.boolean(),
  exports: z.array(z.string()),
  reexports: z.array(z.string()),
  variants: z.array(CvaVariantGroupSchema),
  notes: z.array(z.string()),
});

export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;
export type ComponentSummary = z.infer<typeof ComponentSummarySchema>;
export type GetComponentsInput = z.infer<typeof GetComponentsInputSchema>;
export type GetComponentsOutput = z.infer<typeof GetComponentsOutputSchema>;
export type ComponentsSearchInput = z.infer<typeof ComponentsSearchInputSchema>;
export type ComponentsSearchOutput = z.infer<
  typeof ComponentsSearchOutputSchema
>;
export type GetComponentContentInput = z.infer<
  typeof GetComponentContentInputSchema
>;
export type GetComponentContentOutput = z.infer<
  typeof GetComponentContentOutputSchema
>;
export type GetComponentPropsInput = z.infer<
  typeof GetComponentPropsInputSchema
>;
export type GetComponentPropsOutput = z.infer<
  typeof GetComponentPropsOutputSchema
>;
