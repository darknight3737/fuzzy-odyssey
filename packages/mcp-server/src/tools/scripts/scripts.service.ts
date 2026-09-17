import type {
  GetHealthcheckScriptsOutput,
  GetScriptDetailsInput,
  GetScriptsOutput,
  ScriptInfo,
} from './schema';

export interface ScriptsDeps {
  rootPath: string;
  readRootPackageJson(): Promise<{ scripts?: Record<string, unknown> }>;
}

type ScriptMetadata = Omit<ScriptInfo, 'name' | 'command'>;

/**
 * Curated guidance for well-known root scripts. Scripts not listed here are
 * still returned, with generic metadata derived from package.json.
 */
const SCRIPT_CATALOG: Record<string, Partial<ScriptMetadata>> = {
  dev: {
    category: 'development',
    description:
      'Start development servers for all applications in parallel with hot reloading',
    usage: 'Run this to start developing. Opens web app on port 3000.',
    importance: 'medium',
  },
  build: {
    category: 'build',
    description:
      'Build all applications and packages for production deployment',
    usage:
      'Use before deploying to production. Ensures all code compiles correctly.',
    importance: 'medium',
  },
  typecheck: {
    category: 'linting',
    description:
      'Run TypeScript compiler to check for type errors across all packages',
    usage:
      'Run after writing code to ensure type safety. Must pass before commits.',
    importance: 'critical',
    healthcheck: true,
  },
  lint: {
    category: 'linting',
    description:
      'Run Oxlint to check code quality and enforce coding standards',
    usage: 'Run after writing code. Must pass before commits.',
    importance: 'critical',
    healthcheck: true,
  },
  'lint:fix': {
    category: 'linting',
    description:
      'Run Oxlint with auto-fix to automatically resolve fixable issues',
    usage: 'Use to automatically fix linting issues before manual fixes.',
    importance: 'high',
    healthcheck: true,
    mutates_files: true,
  },
  format: {
    category: 'linting',
    description: 'Check code formatting with Oxfmt across all files',
    usage: 'Verify code follows consistent formatting standards.',
    importance: 'high',
    healthcheck: true,
  },
  'format:fix': {
    category: 'linting',
    description: 'Auto-format all code with Oxfmt to ensure consistent styling',
    usage: 'Use to automatically format code before commits.',
    importance: 'high',
    healthcheck: true,
    mutates_files: true,
  },
  healthcheck: {
    category: 'linting',
    description:
      'Run lint:fix, format:fix, typecheck and manypkg fix in one go',
    usage: 'Convenience wrapper for the full verification loop. Mutates files.',
    importance: 'high',
    mutates_files: true,
  },
  test: {
    category: 'testing',
    description: 'Run all test suites across the monorepo',
    usage: 'Execute to verify functionality. Should pass before commits.',
    importance: 'high',
    healthcheck: true,
  },
  'test:unit': {
    category: 'testing',
    description: 'Run unit test suites only',
    usage: 'Faster than the full test script; use during development.',
    importance: 'medium',
  },
  'supabase:web:start': {
    category: 'database',
    description: 'Start local Supabase instance for development',
    usage: 'Required for local development with database access.',
    importance: 'critical',
  },
  'supabase:web:stop': {
    category: 'database',
    description: 'Stop the local Supabase instance',
    usage: 'Use when done developing to free up resources.',
    importance: 'medium',
  },
  'supabase:web:reset': {
    category: 'database',
    description: 'Reset local database to latest schema and seed data',
    usage: 'Destroys local data. Use when the database needs a fresh start.',
    importance: 'high',
  },
  'supabase:web:typegen': {
    category: 'database',
    description: 'Generate TypeScript types from Supabase database schema',
    usage: 'Run after database schema changes to update types.',
    importance: 'high',
  },
  'supabase:web:test': {
    category: 'testing',
    description: 'Run pgTAP database tests',
    usage: 'Test database functions, RLS policies, and migrations.',
    importance: 'high',
  },
  clean: {
    category: 'maintenance',
    description: 'Remove all generated files and dependencies',
    usage: 'Use when build artifacts are corrupted. Requires reinstall after.',
    importance: 'medium',
  },
  'clean:workspaces': {
    category: 'maintenance',
    description: 'Clean all workspace packages using Turbo',
    usage: 'Lighter cleanup that preserves node_modules.',
    importance: 'medium',
  },
  'stripe:listen': {
    category: 'development',
    description: 'Start Stripe webhook listener for local development',
    usage: 'Required when testing payment workflows locally.',
    importance: 'medium',
  },
  update: {
    category: 'maintenance',
    description: 'Update all dependencies across the monorepo',
    usage: 'Keep dependencies current. Test thoroughly after updating.',
    importance: 'low',
  },
  'syncpack:list': {
    category: 'maintenance',
    description: 'List dependency version mismatches across packages',
    usage: 'Identify inconsistent package versions in monorepo.',
    importance: 'low',
  },
  'syncpack:fix': {
    category: 'maintenance',
    description: 'Fix dependency version mismatches across packages',
    usage: 'Automatically align package versions across workspaces.',
    importance: 'low',
  },
};

const IMPORTANCE_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

/** Check-only first, so a failing run never leaves the tree half-rewritten. */
const HEALTHCHECK_ORDER = ['typecheck', 'lint', 'format', 'test'];

export function createScriptsService(deps: ScriptsDeps) {
  return new ScriptsService(deps);
}

export class ScriptsService {
  constructor(private readonly deps: ScriptsDeps) {}

  async list(): Promise<GetScriptsOutput> {
    const scripts = await this.readScripts();

    return {
      scripts,
      total: scripts.length,
    };
  }

  async getDetails(input: GetScriptDetailsInput): Promise<ScriptInfo> {
    const scripts = await this.readScripts();
    const script = scripts.find((item) => item.name === input.scriptName);

    if (!script) {
      throw new Error(`Script "${input.scriptName}" not found`);
    }

    return script;
  }

  async getHealthcheckScripts(): Promise<GetHealthcheckScriptsOutput> {
    const scripts = (await this.readScripts()).filter(
      (script) => script.healthcheck,
    );

    const names = new Set(scripts.map((script) => script.name));

    return {
      scripts,
      recommended_order: HEALTHCHECK_ORDER.filter((name) => names.has(name)),
      note: 'Run these after every change. Prefer the run_checks tool, which parses their output into diagnostics.',
    };
  }

  private async readScripts(): Promise<ScriptInfo[]> {
    const packageJson = await this.deps.readRootPackageJson();
    const entries = Object.entries(packageJson.scripts ?? {});

    const scripts = entries.flatMap(([name, command]) =>
      typeof command === 'string' ? [describeScript(name, command)] : [],
    );

    return scripts.sort(
      (a, b) =>
        IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance] ||
        a.name.localeCompare(b.name),
    );
  }
}

export function describeScript(name: string, command: string): ScriptInfo {
  const metadata = SCRIPT_CATALOG[name] ?? {};

  return {
    name,
    command,
    category: metadata.category ?? inferCategory(name),
    description: metadata.description ?? `Custom script: ${name}`,
    usage: metadata.usage ?? 'See package.json for command details.',
    importance: metadata.importance ?? 'low',
    healthcheck: metadata.healthcheck ?? false,
    mutates_files: metadata.mutates_files ?? false,
  };
}

function inferCategory(name: string): ScriptInfo['category'] {
  if (name.startsWith('supabase') || name.includes('db')) return 'database';
  if (name.startsWith('test')) return 'testing';
  if (name.startsWith('lint') || name.startsWith('format')) return 'linting';
  if (name.startsWith('build')) return 'build';
  if (name.startsWith('dev') || name.startsWith('stripe')) return 'development';
  if (name.startsWith('env')) return 'environment';

  return 'maintenance';
}
