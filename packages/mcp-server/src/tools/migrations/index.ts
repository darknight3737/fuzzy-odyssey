import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { execFileAsync } from '../../lib/process-utils';
import {
  MUTATING_TOOL,
  READ_ONLY_OPEN_WORLD_TOOL,
  READ_ONLY_TOOL,
  buildErrorResponse,
  buildStructuredResponse,
} from '../../lib/tool-response';
import {
  type MigrationsDeps,
  createMigrationsService,
} from './migrations.service';
import {
  CreateMigrationInputSchema,
  CreateMigrationOutputSchema,
  DiffMigrationsInputSchema,
  DiffMigrationsOutputSchema,
  GetMigrationContentInputSchema,
  GetMigrationContentOutputSchema,
  GetMigrationsInputSchema,
  GetMigrationsOutputSchema,
} from './schema';

import { readFile, readdir } from 'node:fs/promises';

export function registerGetMigrationsTools(
  server: McpServer,
  rootPath?: string,
  deps: MigrationsDeps = createMigrationsDeps(rootPath),
) {
  const service = createMigrationsService(deps);

  server.registerTool(
    'get_migrations',
    {
      title: 'List migration files',
      description:
        'List Supabase migration files (historical changes). For the current schema use get_schema_files instead.',
      inputSchema: GetMigrationsInputSchema,
      outputSchema: GetMigrationsOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async () => {
      try {
        return buildStructuredResponse(await service.list());
      } catch (error) {
        return buildErrorResponse('get_migrations', error);
      }
    },
  );

  server.registerTool(
    'get_migration_content',
    {
      title: 'Read a migration file',
      description:
        'Read one migration file by name (historical). For the current schema use get_schema_content instead.',
      inputSchema: GetMigrationContentInputSchema,
      outputSchema: GetMigrationContentOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (input) => {
      try {
        const parsed = GetMigrationContentInputSchema.parse(input);

        return buildStructuredResponse(await service.getContent(parsed));
      } catch (error) {
        return buildErrorResponse('get_migration_content', error);
      }
    },
  );

  server.registerTool(
    'create_migration',
    {
      title: 'Create a migration file',
      description:
        'Create an empty timestamped Supabase migration file via the Supabase CLI.',
      inputSchema: CreateMigrationInputSchema,
      outputSchema: CreateMigrationOutputSchema,
      annotations: MUTATING_TOOL,
    },
    async (input) => {
      try {
        const parsed = CreateMigrationInputSchema.parse(input);

        return buildStructuredResponse(await service.create(parsed));
      } catch (error) {
        return buildErrorResponse('create_migration', error);
      }
    },
  );

  server.registerTool(
    'diff_migrations',
    {
      title: 'Diff schemas against the database',
      description:
        'Run supabase db diff to compare the declarative schema files with the local database and return the SQL diff.',
      inputSchema: DiffMigrationsInputSchema,
      outputSchema: DiffMigrationsOutputSchema,
      // Does not change the project, but starts a shadow database container.
      annotations: READ_ONLY_OPEN_WORLD_TOOL,
    },
    async () => {
      try {
        return buildStructuredResponse(await service.diff());
      } catch (error) {
        return buildErrorResponse('diff_migrations', error);
      }
    },
  );
}

export function createMigrationsDeps(rootPath = process.cwd()): MigrationsDeps {
  return {
    rootPath,
    readdir(path) {
      return readdir(path);
    },
    readFile(path) {
      return readFile(path, 'utf8');
    },
    async executeCommand(command, args) {
      try {
        const result = await execFileAsync(command, args, { cwd: rootPath });

        return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
      } catch (error) {
        if (error instanceof Error && 'code' in error) {
          const exec = error as Error & {
            code?: number | string;
            stdout?: string;
            stderr?: string;
          };

          return {
            stdout: exec.stdout ?? '',
            stderr: exec.stderr ?? error.message,
            exitCode: typeof exec.code === 'number' ? exec.code : 1,
          };
        }

        throw error;
      }
    },
  };
}

export {
  createMigrationsService,
  type MigrationsDeps,
} from './migrations.service';
export type {
  GetMigrationsOutput,
  GetMigrationContentOutput,
  CreateMigrationOutput,
  DiffMigrationsOutput,
} from './schema';
