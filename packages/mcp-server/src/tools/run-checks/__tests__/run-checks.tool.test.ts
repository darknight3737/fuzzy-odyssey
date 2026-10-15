import { describe, expect, it } from 'vitest';

import { registerRunChecksTool } from '../index';
import type { RunChecksDeps } from '../run-checks.service';
import { RunChecksOutputSchema } from '../schema';

interface RegisteredTool {
  name: string;
  config: Record<string, unknown>;
  handler: (input: unknown) => Promise<Record<string, unknown>>;
}

function createFakeServer() {
  const tools: RegisteredTool[] = [];

  const server = {
    registerTool(
      name: string,
      config: Record<string, unknown>,
      handler: (input: unknown) => Promise<Record<string, unknown>>,
    ) {
      tools.push({ name, config, handler });
      return {};
    },
  };

  return { server, tools };
}

function createDeps(overrides: Partial<RunChecksDeps> = {}): RunChecksDeps {
  return {
    rootPath: '/repo',
    async readRootPackageJson() {
      return {
        scripts: { typecheck: 'tsc', lint: 'oxlint', format: 'oxfmt --check' },
      };
    },
    async executeCommand() {
      return { stdout: '', stderr: '', exitCode: 0 };
    },
    now: () => 0,
    ...overrides,
  };
}

describe('registerRunChecksTool', () => {
  it('registers run_checks with annotations and returns typed structured output', async () => {
    const { server, tools } = createFakeServer();

    registerRunChecksTool(server as never, '/repo', createDeps());

    expect(tools).toHaveLength(1);
    expect(tools[0]?.name).toBe('run_checks');
    expect(tools[0]?.config.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
    });

    const result = await tools[0]!.handler({});
    const parsed = RunChecksOutputSchema.parse(result.structuredContent);

    expect(parsed.overall).toBe('pass');
    expect(parsed.summary.total).toBe(3);
  });

  it('returns an error response for invalid input', async () => {
    const { server, tools } = createFakeServer();

    registerRunChecksTool(server as never, '/repo', createDeps());

    const result = await tools[0]!.handler({ maxOutputChars: 1 });

    expect(result.isError).toBe(true);
  });
});
