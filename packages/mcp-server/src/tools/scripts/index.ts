import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  READ_ONLY_TOOL,
  buildErrorResponse,
  buildStructuredResponse,
} from '../../lib/tool-response';
import {
  GetHealthcheckScriptsInputSchema,
  GetHealthcheckScriptsOutputSchema,
  GetScriptDetailsInputSchema,
  GetScriptDetailsOutputSchema,
  GetScriptsInputSchema,
  GetScriptsOutputSchema,
} from './schema';
import { type ScriptsDeps, createScriptsService } from './scripts.service';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function registerScriptsTools(
  server: McpServer,
  rootPath?: string,
  deps: ScriptsDeps = createScriptsDeps(rootPath),
) {
  const service = createScriptsService(deps);

  server.registerTool(
    'get_scripts',
    {
      title: 'List root scripts',
      description:
        'List every root package.json script with category, importance, usage guidance and whether it mutates files.',
      inputSchema: GetScriptsInputSchema,
      outputSchema: GetScriptsOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async () => {
      try {
        return buildStructuredResponse(await service.list());
      } catch (error) {
        return buildErrorResponse('get_scripts', error);
      }
    },
  );

  server.registerTool(
    'get_script_details',
    {
      title: 'Describe a script',
      description:
        'Get detailed information about one root package.json script.',
      inputSchema: GetScriptDetailsInputSchema,
      outputSchema: GetScriptDetailsOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (input) => {
      try {
        const parsed = GetScriptDetailsInputSchema.parse(input);

        return buildStructuredResponse(await service.getDetails(parsed));
      } catch (error) {
        return buildErrorResponse('get_script_details', error);
      }
    },
  );

  server.registerTool(
    'get_healthcheck_scripts',
    {
      title: 'List verification scripts',
      description:
        'List the scripts that must pass after writing code (typecheck, lint, format, test) in the recommended order.',
      inputSchema: GetHealthcheckScriptsInputSchema,
      outputSchema: GetHealthcheckScriptsOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async () => {
      try {
        return buildStructuredResponse(await service.getHealthcheckScripts());
      } catch (error) {
        return buildErrorResponse('get_healthcheck_scripts', error);
      }
    },
  );
}

export function createScriptsDeps(rootPath = process.cwd()): ScriptsDeps {
  return {
    rootPath,
    async readRootPackageJson() {
      const content = await readFile(join(rootPath, 'package.json'), 'utf8');

      return JSON.parse(content) as { scripts?: Record<string, unknown> };
    },
  };
}

export {
  createScriptsService,
  describeScript,
  type ScriptsDeps,
} from './scripts.service';
export type { ScriptInfo, GetScriptsOutput } from './schema';
