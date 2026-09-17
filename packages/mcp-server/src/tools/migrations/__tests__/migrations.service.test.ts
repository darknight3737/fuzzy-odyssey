import { describe, expect, it } from 'vitest';

import {
  type MigrationsDeps,
  createMigrationsService,
} from '../migrations.service';

const normalize = (path: string) => path.replace(/\\/g, '/');

function createDeps(
  files: Record<string, string> = {},
  overrides: Partial<MigrationsDeps> = {},
): MigrationsDeps {
  return {
    rootPath: '/repo',
    async readdir() {
      return Object.keys(files);
    },
    async readFile(path) {
      const name = normalize(path).split('/').pop() ?? '';
      const content = files[name];

      if (content === undefined) {
        throw new Error('ENOENT');
      }

      return content;
    },
    async executeCommand() {
      return { stdout: '', stderr: '', exitCode: 0 };
    },
    ...overrides,
  };
}

describe('MigrationsService.list', () => {
  it('lists sql files sorted with parsed timestamps', async () => {
    const service = createMigrationsService(
      createDeps({
        '20260202020202_second.sql': '',
        '20260101010101_first.sql': '',
        'README.md': '',
      }),
    );

    const result = await service.list();

    expect(result.total).toBe(2);
    expect(result.migrations.map((m) => m.name)).toEqual([
      '20260101010101_first.sql',
      '20260202020202_second.sql',
    ]);
    expect(result.migrations[0]?.timestamp).toBe('20260101010101');
    expect(normalize(result.migrations_dir)).toBe(
      '/repo/apps/web/supabase/migrations',
    );
  });

  it('returns an empty list when the directory is missing', async () => {
    const service = createMigrationsService(
      createDeps(
        {},
        {
          async readdir() {
            throw new Error('ENOENT');
          },
        },
      ),
    );

    expect((await service.list()).total).toBe(0);
  });
});

describe('MigrationsService.getContent', () => {
  it('reads a migration by bare file name', async () => {
    const service = createMigrationsService(
      createDeps({ '20260101010101_first.sql': 'create table x();' }),
    );

    const result = await service.getContent({
      path: '20260101010101_first.sql',
    });

    expect(result.content).toBe('create table x();');
    expect(normalize(result.path)).toBe(
      '/repo/apps/web/supabase/migrations/20260101010101_first.sql',
    );
  });

  it.each(['../secrets.sql', 'sub/file.sql', 'sub\\file.sql', '.env', ' '])(
    'rejects unsafe file name %j',
    async (path) => {
      const service = createMigrationsService(createDeps({}));

      await expect(service.getContent({ path })).rejects.toThrow(
        /Invalid migration file name/,
      );
    },
  );

  it('throws a not-found error for unknown files', async () => {
    const service = createMigrationsService(createDeps({}));

    await expect(service.getContent({ path: 'missing.sql' })).rejects.toThrow(
      /not found/,
    );
  });
});

describe('MigrationsService.create', () => {
  it('rejects names with unsafe characters', async () => {
    const service = createMigrationsService(createDeps({}));

    await expect(service.create({ name: 'bad name;rm' })).rejects.toThrow(
      /letters, numbers/,
    );
  });

  it('runs the supabase CLI and reports the created file', async () => {
    const files: Record<string, string> = {};
    const calls: string[][] = [];

    const service = createMigrationsService(
      createDeps(files, {
        async executeCommand(command, args) {
          calls.push([command, ...args]);
          files['20260303030303_add_notes.sql'] = '';
          return { stdout: 'Created new migration', stderr: '', exitCode: 0 };
        },
      }),
    );

    const result = await service.create({ name: 'add_notes' });

    expect(calls[0]).toEqual([
      'pnpm',
      '--filter',
      'web',
      'supabase',
      'migrations',
      'new',
      'add_notes',
    ]);
    expect(result.created?.name).toBe('20260303030303_add_notes.sql');
    expect(result.output).toBe('Created new migration');
  });

  it('surfaces CLI failures', async () => {
    const service = createMigrationsService(
      createDeps(
        {},
        {
          async executeCommand() {
            return { stdout: '', stderr: 'docker not running', exitCode: 1 };
          },
        },
      ),
    );

    await expect(service.create({ name: 'x' })).rejects.toThrow(
      /docker not running/,
    );
  });
});

describe('MigrationsService.diff', () => {
  it('reports has_changes false when the CLI finds nothing', async () => {
    const service = createMigrationsService(
      createDeps(
        {},
        {
          async executeCommand() {
            return {
              stdout: 'No schema changes found\n',
              stderr: '',
              exitCode: 0,
            };
          },
        },
      ),
    );

    const result = await service.diff();

    expect(result.has_changes).toBe(false);
  });

  it('returns the SQL diff when present', async () => {
    const service = createMigrationsService(
      createDeps(
        {},
        {
          async executeCommand() {
            return {
              stdout: 'alter table x add column y text;\n',
              stderr: '',
              exitCode: 0,
            };
          },
        },
      ),
    );

    const result = await service.diff();

    expect(result.has_changes).toBe(true);
    expect(result.diff).toContain('alter table');
  });
});
