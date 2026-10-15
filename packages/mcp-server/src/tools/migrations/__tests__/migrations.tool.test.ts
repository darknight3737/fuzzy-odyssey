import { describe, expect, it } from 'vitest';

import { createFakeMcpServer } from '../../../lib/testing/fake-mcp-server';
import { registerGetMigrationsTools } from '../index';
import type { MigrationsDeps } from '../migrations.service';

function createDeps(): MigrationsDeps {
  const files: Record<string, string> = {
    '20260101010101_init.sql': 'create table x();',
  };

  return {
    rootPath: '/repo',
    async readdir() {
      return Object.keys(files);
    },
    async readFile(path) {
      const name = path.replace(/\\/g, '/').split('/').pop() ?? '';
      const content = files[name];
      if (content === undefined) throw new Error('ENOENT');
      return content;
    },
    async executeCommand(_command, args) {
      if (args.includes('diff')) {
        return { stdout: 'No schema changes found\n', stderr: '', exitCode: 0 };
      }

      files['20260202020202_added.sql'] = '';
      return { stdout: 'Created', stderr: '', exitCode: 0 };
    },
  };
}

describe('registerGetMigrationsTools', () => {
  const fake = createFakeMcpServer();
  registerGetMigrationsTools(fake.server, '/repo', createDeps());

  it('registers the migration tools with honest annotations', () => {
    expect(fake.tool('get_migrations').config.annotations?.readOnlyHint).toBe(
      true,
    );
    expect(
      fake.tool('get_migration_content').config.annotations?.readOnlyHint,
    ).toBe(true);
    expect(fake.tool('create_migration').config.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
    });
    // Starts a shadow database container: read-only but reaches outside.
    expect(fake.tool('diff_migrations').config.annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: true,
    });
  });

  it('returns schema-valid structured content', async () => {
    const list = await fake.call('get_migrations');
    expect(list.structuredContent).toMatchObject({ total: 1 });

    const content = await fake.call('get_migration_content', {
      path: '20260101010101_init.sql',
    });
    expect(content.structuredContent).toMatchObject({
      content: 'create table x();',
    });

    const diff = await fake.call('diff_migrations');
    expect(diff.structuredContent).toMatchObject({ has_changes: false });

    const created = await fake.call('create_migration', { name: 'added' });
    expect(created.structuredContent).toMatchObject({
      created: { name: '20260202020202_added.sql' },
    });
  });

  it('rejects traversal and invalid names as errors', async () => {
    expect(
      (await fake.call('get_migration_content', { path: '../x.sql' })).isError,
    ).toBe(true);
    expect(
      (await fake.call('create_migration', { name: 'bad name' })).isError,
    ).toBe(true);
  });
});
