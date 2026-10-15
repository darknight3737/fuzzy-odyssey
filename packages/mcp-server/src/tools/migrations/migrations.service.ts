import { assertSafeFileName } from '../../lib/safe-file-name';
import type {
  CreateMigrationInput,
  CreateMigrationOutput,
  DiffMigrationsOutput,
  GetMigrationContentInput,
  GetMigrationContentOutput,
  GetMigrationsOutput,
  MigrationFile,
} from './schema';

import { join } from 'node:path';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface MigrationsDeps {
  rootPath: string;
  readdir(path: string): Promise<string[]>;
  readFile(path: string): Promise<string>;
  executeCommand(command: string, args: string[]): Promise<CommandResult>;
}

const HISTORICAL_NOTE =
  'Migrations are historical. For the current schema use get_schema_files / get_schema_content.';

const MIGRATION_NAME = /^[a-zA-Z0-9_-]+$/;
const MIGRATION_FILE = /^(\d{14})_(.+)\.sql$/;

export function createMigrationsService(deps: MigrationsDeps) {
  return new MigrationsService(deps);
}

export class MigrationsService {
  constructor(private readonly deps: MigrationsDeps) {}

  get migrationsDir() {
    return join(this.deps.rootPath, 'apps', 'web', 'supabase', 'migrations');
  }

  async list(): Promise<GetMigrationsOutput> {
    const migrations = await this.readMigrations();

    return {
      migrations,
      total: migrations.length,
      migrations_dir: this.migrationsDir,
      note: HISTORICAL_NOTE,
    };
  }

  async getContent(
    input: GetMigrationContentInput,
  ): Promise<GetMigrationContentOutput> {
    const name = assertSafeFileName(input.path, 'migration file name');
    const path = join(this.migrationsDir, name);

    let content: string;

    try {
      content = await this.deps.readFile(path);
    } catch {
      throw new Error(`Migration file "${name}" not found`);
    }

    return {
      name,
      path,
      content,
      note: HISTORICAL_NOTE,
    };
  }

  async create(input: CreateMigrationInput): Promise<CreateMigrationOutput> {
    if (!MIGRATION_NAME.test(input.name)) {
      throw new Error(
        'Migration name must contain only letters, numbers, hyphens, or underscores',
      );
    }

    const before = new Set((await this.readMigrations()).map((m) => m.name));

    const result = await this.deps.executeCommand('pnpm', [
      '--filter',
      'web',
      'supabase',
      'migrations',
      'new',
      input.name,
    ]);

    if (result.exitCode !== 0) {
      throw new Error(
        `supabase migrations new failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`,
      );
    }

    const after = await this.readMigrations();
    const created = after.find((m) => !before.has(m.name)) ?? null;

    return {
      status: 'success',
      created,
      output: `${result.stdout}${result.stderr}`.trim(),
    };
  }

  async diff(): Promise<DiffMigrationsOutput> {
    const result = await this.deps.executeCommand('pnpm', [
      '--filter',
      'web',
      'supabase',
      'db',
      'diff',
    ]);

    if (result.exitCode !== 0) {
      throw new Error(
        `supabase db diff failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`,
      );
    }

    const diff = result.stdout.trim();

    return {
      has_changes: diff.length > 0 && !/no schema changes found/i.test(diff),
      diff,
    };
  }

  private async readMigrations(): Promise<MigrationFile[]> {
    let names: string[];

    try {
      names = await this.deps.readdir(this.migrationsDir);
    } catch {
      return [];
    }

    return names
      .filter((name) => name.endsWith('.sql'))
      .sort()
      .map((name) => ({
        name,
        timestamp: name.match(MIGRATION_FILE)?.[1] ?? null,
        path: join(this.migrationsDir, name),
      }));
  }
}
