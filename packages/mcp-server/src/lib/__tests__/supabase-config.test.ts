import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SUPABASE_PORTS,
  buildLocalDatabaseUrl,
  parseSupabaseConfig,
  parseTomlSectionPort,
  resolveSupabaseConfig,
} from '../supabase-config';

const SAMPLE_TOML = `
# A comment
project_id = "my-worktree"

[api]
enabled = true
port = 64321 # offset for worktree
schemas = ["public"]

[db]
port = 64322
major_version = 15

[db.pooler]
enabled = false
port = 64329

[studio]
enabled = true
port = 64323

[inbucket]
enabled = true
port = 64324
`;

describe('parseTomlSectionPort', () => {
  it('reads the first port inside the requested section only', () => {
    expect(parseTomlSectionPort(SAMPLE_TOML, 'db')).toBe(64322);
    expect(parseTomlSectionPort(SAMPLE_TOML, 'db.pooler')).toBe(64329);
    expect(parseTomlSectionPort(SAMPLE_TOML, 'api')).toBe(64321);
  });

  it('returns undefined for a missing section', () => {
    expect(parseTomlSectionPort(SAMPLE_TOML, 'realtime')).toBeUndefined();
  });

  it('ignores trailing comments', () => {
    expect(parseTomlSectionPort('[api]\nport = 1234 # note\n', 'api')).toBe(
      1234,
    );
  });
});

describe('parseSupabaseConfig', () => {
  it('extracts project id and every known port', () => {
    const config = parseSupabaseConfig(SAMPLE_TOML);

    expect(config.projectId).toBe('my-worktree');
    expect(config.ports).toEqual({
      api: 64321,
      db: 64322,
      studio: 64323,
      mailbox: 64324,
    });
  });

  it('falls back to defaults for missing sections', () => {
    const config = parseSupabaseConfig('[api]\nport = 1\n');

    expect(config.projectId).toBeNull();
    expect(config.ports).toEqual({ ...DEFAULT_SUPABASE_PORTS, api: 1 });
  });

  it('accepts every known mail catcher section name', () => {
    expect(parseSupabaseConfig('[mailpit]\nport = 9999\n').ports.mailbox).toBe(
      9999,
    );
    expect(
      parseSupabaseConfig('[local_smtp]\nport = 8888\n').ports.mailbox,
    ).toBe(8888);
  });

  it("reads the mail catcher port from this repo's real config.toml", async () => {
    const { readFile } = await import('node:fs/promises');
    const toml = await readFile(
      new URL('../../../../../apps/web/supabase/config.toml', import.meta.url),
      'utf8',
    );

    expect(parseSupabaseConfig(toml).ports.mailbox).toBe(54324);
    expect(parseSupabaseConfig(toml).ports.db).toBe(54322);
  });

  it('keeps # inside quoted values', () => {
    expect(parseSupabaseConfig('project_id = "my#project"\n').projectId).toBe(
      'my#project',
    );
  });
});

describe('resolveSupabaseConfig', () => {
  it('uses defaults when the file cannot be read', async () => {
    const config = await resolveSupabaseConfig('/repo', async () => {
      throw new Error('ENOENT');
    });

    expect(config.ports).toEqual(DEFAULT_SUPABASE_PORTS);
    expect(config.projectId).toBeNull();
  });

  it('reads apps/web/supabase/config.toml under the root', async () => {
    let requested = '';

    await resolveSupabaseConfig('/repo', async (path) => {
      requested = path.replace(/\\/g, '/');
      return SAMPLE_TOML;
    });

    expect(requested).toBe('/repo/apps/web/supabase/config.toml');
  });
});

describe('buildLocalDatabaseUrl', () => {
  it('targets the given port on localhost', () => {
    expect(buildLocalDatabaseUrl(64322)).toBe(
      'postgresql://postgres:postgres@127.0.0.1:64322/postgres',
    );
  });
});
