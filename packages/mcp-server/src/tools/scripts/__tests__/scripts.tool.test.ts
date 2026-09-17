import { describe, expect, it } from 'vitest';

import { createFakeMcpServer } from '../../../lib/testing/fake-mcp-server';
import { registerScriptsTools } from '../index';

describe('registerScriptsTools', () => {
  const fake = createFakeMcpServer();

  registerScriptsTools(fake.server, '/repo', {
    rootPath: '/repo',
    async readRootPackageJson() {
      return {
        scripts: {
          typecheck: 'tsc',
          lint: 'oxlint',
          'lint:fix': 'oxlint --fix',
        },
      };
    },
  });

  it('registers three read-only tools', () => {
    expect(fake.tools.map((tool) => tool.name).sort()).toEqual([
      'get_healthcheck_scripts',
      'get_script_details',
      'get_scripts',
    ]);

    for (const tool of fake.tools) {
      expect(tool.config.annotations?.readOnlyHint).toBe(true);
    }
  });

  it('returns schema-valid structured content', async () => {
    const all = await fake.call('get_scripts');
    expect(all.structuredContent).toMatchObject({ total: 3 });

    const details = await fake.call('get_script_details', {
      scriptName: 'lint:fix',
    });
    expect(details.structuredContent).toMatchObject({ mutates_files: true });

    const health = await fake.call('get_healthcheck_scripts');
    expect(health.structuredContent).toMatchObject({
      recommended_order: ['typecheck', 'lint'],
    });
  });

  it('returns an error for unknown scripts', async () => {
    const result = await fake.call('get_script_details', {
      scriptName: 'nope',
    });

    expect(result.isError).toBe(true);
  });
});
