import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { execFileAsync } from '../../lib/process-utils';
import {
  MUTATING_TOOL,
  buildErrorResponse,
  buildStructuredResponse,
} from '../../lib/tool-response';
import {
  type RunChecksDeps,
  createRunChecksService,
} from './run-checks.service';
import { RunChecksInputSchema, RunChecksOutputSchema } from './schema';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** A full-monorepo typecheck can take a while; anything longer is stuck. */
const CHECK_TIMEOUT_MS = 10 * 60 * 1000;

/** Turbo streams every package's output; 10MB was tight for a cold run. */
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

export function registerRunChecksTool(
  server: McpServer,
  rootPath?: string,
  deps: RunChecksDeps = createRunChecksDeps(rootPath),
) {
  const service = createRunChecksService(deps);

  return server.registerTool(
    'run_checks',
    {
      title: 'Run code quality checks',
      description:
        'Run typecheck, lint and format checks (check-only by default) and return parsed diagnostics with file, line, rule and message. ' +
        'Pass fix: true to run lint:fix and format:fix instead, or includeTests: true to also run the test suite.',
      inputSchema: RunChecksInputSchema,
      outputSchema: RunChecksOutputSchema,
      // Read-only unless `fix: true`; declare the broader capability so
      // clients never auto-approve a call that could rewrite files.
      annotations: MUTATING_TOOL,
    },
    async (input) => {
      try {
        const parsed = RunChecksInputSchema.parse(input);
        const result = await service.run(parsed);

        return buildStructuredResponse(result);
      } catch (error) {
        return buildErrorResponse('run_checks', error);
      }
    },
  );
}

export function createRunChecksDeps(rootPath = process.cwd()): RunChecksDeps {
  return {
    rootPath,
    async readRootPackageJson() {
      const path = join(rootPath, 'package.json');
      const content = await readFile(path, 'utf8');
      return JSON.parse(content) as { scripts?: Record<string, string> };
    },
    async executeCommand(command, args) {
      try {
        const result = await execFileAsync(command, args, {
          cwd: rootPath,
          maxBuffer: MAX_OUTPUT_BYTES,
          timeout: CHECK_TIMEOUT_MS,
        });

        return {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: 0,
        };
      } catch (error) {
        if (isExecError(error)) {
          return {
            stdout: error.stdout ?? '',
            // Spawn failures (ENOENT), timeouts and buffer overflows carry the
            // reason only in error.message; never drop it.
            stderr: error.stderr || describeExecFailure(error),
            exitCode: typeof error.code === 'number' ? error.code : 1,
          };
        }

        throw error;
      }
    },
    now() {
      return Date.now();
    },
  };
}

interface ExecError extends Error {
  code?: number | string;
  killed?: boolean;
  signal?: string | null;
  stdout?: string;
  stderr?: string;
}

function isExecError(error: unknown): error is ExecError {
  return error instanceof Error && ('code' in error || 'killed' in error);
}

function describeExecFailure(error: ExecError) {
  if (error.killed || error.signal === 'SIGTERM') {
    return `Command timed out after ${CHECK_TIMEOUT_MS / 1000}s and was killed.`;
  }

  if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
    return `Command output exceeded ${MAX_OUTPUT_BYTES / (1024 * 1024)}MB and was truncated.`;
  }

  return error.message;
}

export {
  createRunChecksService,
  type RunChecksDeps,
} from './run-checks.service';
export { parseDiagnostics } from './diagnostics-parser';
export type { Diagnostic, RunChecksOutput } from './schema';
