import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Ports declared in `apps/web/supabase/config.toml`.
 *
 * Every tool that talks to a local Supabase service must resolve ports through
 * this module so a single edit to config.toml (for example, per-worktree port
 * offsets) is honoured everywhere.
 */
export interface SupabasePorts {
  api: number;
  db: number;
  studio: number;
  mailbox: number;
}

export interface SupabaseLocalConfig {
  projectId: string | null;
  ports: SupabasePorts;
}

export const DEFAULT_SUPABASE_PORTS: SupabasePorts = {
  api: 54321,
  db: 54322,
  studio: 54323,
  mailbox: 54324,
};

const PORT_SECTIONS: Record<keyof SupabasePorts, string[]> = {
  api: ['api'],
  db: ['db'],
  studio: ['studio'],
  // Supabase has renamed the local mail catcher over time; this repo uses
  // [local_smtp]. Accept every known name.
  mailbox: ['local_smtp', 'inbucket', 'mailpit'],
};

export function getSupabaseConfigPath(rootPath: string) {
  return join(rootPath, 'apps', 'web', 'supabase', 'config.toml');
}

/**
 * Parse the subset of config.toml we care about. Falls back to defaults for
 * any section that is missing, so a partial or absent file still yields a
 * complete config.
 */
export function parseSupabaseConfig(toml: string): SupabaseLocalConfig {
  const ports = { ...DEFAULT_SUPABASE_PORTS };

  for (const key of Object.keys(PORT_SECTIONS) as Array<keyof SupabasePorts>) {
    for (const section of PORT_SECTIONS[key]) {
      const port = parseTomlSectionPort(toml, section);

      if (port !== undefined) {
        ports[key] = port;
        break;
      }
    }
  }

  return {
    projectId: parseTopLevelString(toml, 'project_id'),
    ports,
  };
}

export async function resolveSupabaseConfig(
  rootPath: string,
  read: (path: string) => Promise<string> = (path) => readFile(path, 'utf8'),
): Promise<SupabaseLocalConfig> {
  try {
    const toml = await read(getSupabaseConfigPath(rootPath));

    return parseSupabaseConfig(toml);
  } catch {
    return {
      projectId: null,
      ports: { ...DEFAULT_SUPABASE_PORTS },
    };
  }
}

export function buildLocalDatabaseUrl(dbPort: number) {
  return `postgresql://postgres:postgres@127.0.0.1:${dbPort}/postgres`;
}

/**
 * Return the port declared under `[section]`. Only the first `port = N` line
 * inside the section is considered; nested tables (e.g. `[db.pooler]`) start a
 * new section and are ignored.
 */
export function parseTomlSectionPort(
  content: string,
  section: string,
): number | undefined {
  let inSection = false;

  for (const rawLine of content.split('\n')) {
    const line = stripTomlComment(rawLine).trim();

    if (line.startsWith('[')) {
      inSection = line === `[${section}]`;
      continue;
    }

    if (!inSection) {
      continue;
    }

    const match = line.match(/^port\s*=\s*(\d+)\s*$/);

    if (match) {
      return Number(match[1]);
    }
  }

  return undefined;
}

function parseTopLevelString(content: string, key: string): string | null {
  for (const rawLine of content.split('\n')) {
    const line = stripTomlComment(rawLine).trim();

    if (line.startsWith('[')) {
      // Top-level keys precede the first table header.
      return null;
    }

    const match = line.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"\\s*$`));

    if (match) {
      return match[1] ?? null;
    }
  }

  return null;
}

function stripTomlComment(line: string) {
  let inString = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (char === '"') {
      inString = !inString;
    } else if (char === '#' && !inString) {
      return line.slice(0, index);
    }
  }

  return line;
}
