import { z } from 'zod/v3';

export const MigrationFileSchema = z.object({
  name: z.string(),
  /** Leading timestamp from the file name, when present. */
  timestamp: z.string().nullable(),
  path: z.string(),
});

export const GetMigrationsInputSchema = z.object({});

export const GetMigrationsOutputSchema = z.object({
  migrations: z.array(MigrationFileSchema),
  total: z.number().int().min(0),
  migrations_dir: z.string(),
  note: z.string(),
});

export const GetMigrationContentInputSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe('Migration file name, e.g. 20260101010101_create_notes.sql'),
});

export const GetMigrationContentOutputSchema = z.object({
  name: z.string(),
  path: z.string(),
  content: z.string(),
  note: z.string(),
});

export const CreateMigrationInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Snake or kebab case name, e.g. add_notes_table'),
});

export const CreateMigrationOutputSchema = z.object({
  status: z.literal('success'),
  /** File created by the Supabase CLI, when it could be detected. */
  created: MigrationFileSchema.nullable(),
  output: z.string(),
});

export const DiffMigrationsInputSchema = z.object({});

export const DiffMigrationsOutputSchema = z.object({
  has_changes: z.boolean(),
  diff: z.string(),
});

export type MigrationFile = z.infer<typeof MigrationFileSchema>;
export type GetMigrationsOutput = z.infer<typeof GetMigrationsOutputSchema>;
export type GetMigrationContentInput = z.infer<
  typeof GetMigrationContentInputSchema
>;
export type GetMigrationContentOutput = z.infer<
  typeof GetMigrationContentOutputSchema
>;
export type CreateMigrationInput = z.infer<typeof CreateMigrationInputSchema>;
export type CreateMigrationOutput = z.infer<typeof CreateMigrationOutputSchema>;
export type DiffMigrationsOutput = z.infer<typeof DiffMigrationsOutputSchema>;
