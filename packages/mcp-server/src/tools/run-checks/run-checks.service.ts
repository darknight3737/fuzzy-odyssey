import { parseDiagnostics } from './diagnostics-parser';
import type {
  Diagnostic,
  RunChecksInput,
  RunChecksOptions,
  RunChecksOutput,
  RunChecksResult,
} from './schema';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface RunChecksDeps {
  rootPath: string;
  readRootPackageJson(): Promise<{ scripts?: Record<string, string> }>;
  executeCommand(command: string, args: string[]): Promise<CommandResult>;
  now(): number;
}

/** Check-only by default: nothing here mutates the working tree. */
const CHECK_SCRIPTS = ['typecheck', 'lint', 'format'] as const;

/** Opt-in via `fix: true`. */
const FIX_SCRIPTS = ['typecheck', 'lint:fix', 'format:fix'] as const;

const DEFAULT_MAX_OUTPUT_CHARS = 4000;

export function createRunChecksService(deps: RunChecksDeps) {
  return new RunChecksService(deps);
}

export class RunChecksService {
  constructor(private readonly deps: RunChecksDeps) {}

  async run(input: RunChecksInput = {}): Promise<RunChecksOutput> {
    const options = resolveOptions(input);
    const mode = options.fix ? 'fix' : 'check';
    const maxOutputChars = options.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS;

    const scriptsRequested = this.resolveScripts(options);
    const checks: RunChecksResult[] = [];

    const packageJson = await this.deps.readRootPackageJson();
    const availableScripts = new Set(Object.keys(packageJson.scripts ?? {}));

    let stopRunning = false;

    for (const script of scriptsRequested) {
      if (stopRunning) {
        checks.push(
          buildInertResult(
            script,
            'skipped',
            'Skipped because failFast is enabled and a previous check failed.',
          ),
        );

        continue;
      }

      if (!availableScripts.has(script)) {
        checks.push(
          buildInertResult(
            script,
            'missing',
            `Script "${script}" was not found in root package.json.`,
          ),
        );

        if (options.failFast) {
          stopRunning = true;
        }

        continue;
      }

      const startedAt = this.deps.now();
      const result = await this.deps.executeCommand('pnpm', ['run', script]);
      const duration = Math.max(0, this.deps.now() - startedAt);
      const status = result.exitCode === 0 ? 'pass' : 'fail';

      const diagnostics = parseDiagnostics(
        script,
        `${result.stdout}\n${result.stderr}`,
      );

      checks.push({
        script,
        command: `pnpm run ${script}`,
        status,
        exit_code: result.exitCode,
        duration_ms: duration,
        diagnostics,
        stdout: truncateOutput(result.stdout, maxOutputChars),
        stderr: truncateOutput(result.stderr, maxOutputChars),
        ...(status === 'fail' && diagnostics.length === 0
          ? {
              message:
                'Check failed but no diagnostics could be parsed. Inspect stdout/stderr.',
            }
          : {}),
      });

      if (status === 'fail' && options.failFast) {
        stopRunning = true;
      }
    }

    const diagnostics = flattenDiagnostics(checks);

    const summary = {
      total: checks.length,
      passed: checks.filter((check) => check.status === 'pass').length,
      failed: checks.filter((check) => check.status === 'fail').length,
      missing: checks.filter((check) => check.status === 'missing').length,
      skipped: checks.filter((check) => check.status === 'skipped').length,
      errors: diagnostics.filter((d) => d.severity === 'error').length,
      warnings: diagnostics.filter((d) => d.severity === 'warning').length,
    };

    return {
      overall: summary.failed > 0 || summary.missing > 0 ? 'fail' : 'pass',
      mode,
      scripts_requested: scriptsRequested,
      checks,
      diagnostics,
      summary,
    };
  }

  private resolveScripts(options: RunChecksOptions) {
    const defaults = options.fix ? FIX_SCRIPTS : CHECK_SCRIPTS;

    const list =
      options.scripts && options.scripts.length > 0
        ? [...options.scripts]
        : [...defaults];

    if (options.includeTests) {
      list.push('test');
    }

    return dedupe(list);
  }
}

/**
 * Accept both the flat shape and the legacy `{ state: {...} }` wrapper. Flat
 * fields win when both are present.
 */
function resolveOptions(input: RunChecksInput): RunChecksOptions {
  const { state, ...flat } = input;

  return {
    ...(state ?? {}),
    ...stripUndefined(flat),
  };
}

function stripUndefined<T extends Record<string, unknown>>(
  value: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

function buildInertResult(
  script: string,
  status: 'skipped' | 'missing',
  message: string,
): RunChecksResult {
  return {
    script,
    command: `pnpm run ${script}`,
    status,
    exit_code: null,
    duration_ms: 0,
    diagnostics: [],
    stdout: '',
    stderr: '',
    message,
  };
}

function flattenDiagnostics(checks: RunChecksResult[]): Diagnostic[] {
  const errors: Diagnostic[] = [];
  const rest: Diagnostic[] = [];

  for (const check of checks) {
    for (const diagnostic of check.diagnostics) {
      (diagnostic.severity === 'error' ? errors : rest).push(diagnostic);
    }
  }

  return [...errors, ...rest];
}

function dedupe(list: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of list) {
    if (seen.has(item)) {
      continue;
    }

    seen.add(item);
    output.push(item);
  }

  return output;
}

function truncateOutput(value: string, maxOutputChars: number) {
  if (value.length <= maxOutputChars) {
    return value;
  }

  return `${value.slice(0, maxOutputChars)}\n...[truncated ${value.length - maxOutputChars} chars]`;
}
