import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { READ_ONLY_TOOL } from '../../lib/tool-response';
import {
  type ComponentsDeps,
  createComponentsService,
} from './components.service';
import {
  ComponentsSearchInputSchema,
  ComponentsSearchOutputSchema,
  GetComponentContentInputSchema,
  GetComponentContentOutputSchema,
  GetComponentPropsInputSchema,
  GetComponentPropsOutputSchema,
  GetComponentsInputSchema,
  GetComponentsOutputSchema,
} from './schema';

import { access, readFile } from 'node:fs/promises';
import { join, resolve as resolvePath, sep } from 'node:path';

type TextContent = {
  type: 'text';
  text: string;
};

export function registerComponentsTools(server: McpServer, rootPath?: string) {
  return registerComponentsToolsWithDeps(
    server,
    createComponentsDeps(rootPath),
  );
}

export function registerComponentsToolsWithDeps(
  server: McpServer,
  deps: ComponentsDeps,
) {
  const service = createComponentsService(deps);

  server.registerTool(
    'get_components',
    {
      description:
        'List every component, hook and utility exported by the @kit/ui package, with its import specifier, category and description. Set includeDetails to also return exported symbols, CVA variants and client-component flags.',
      inputSchema: GetComponentsInputSchema,
      outputSchema: GetComponentsOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (input) => {
      try {
        const parsed = GetComponentsInputSchema.parse(input);

        return buildResponse(await service.list(parsed));
      } catch (error) {
        return buildErrorResponse('get_components', error);
      }
    },
  );

  server.registerTool(
    'components_search',
    {
      description:
        'Search @kit/ui exports by keyword across name, description, category and file path',
      inputSchema: ComponentsSearchInputSchema,
      outputSchema: ComponentsSearchOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (input) => {
      try {
        const parsed = ComponentsSearchInputSchema.parse(input);

        return buildResponse(await service.search(parsed));
      } catch (error) {
        return buildErrorResponse('components_search', error);
      }
    },
  );

  server.registerTool(
    'get_component_content',
    {
      description: 'Get the source code of a specific @kit/ui export',
      inputSchema: GetComponentContentInputSchema,
      outputSchema: GetComponentContentOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (input) => {
      try {
        const parsed = GetComponentContentInputSchema.parse(input);

        return buildResponse(await service.getContent(parsed));
      } catch (error) {
        return buildErrorResponse('get_component_content', error);
      }
    },
  );

  server.registerTool(
    'get_component_props',
    {
      description:
        'Inspect a @kit/ui export: exported symbols, component prop types, interfaces/type aliases, CVA variants and Base UI render-prop support',
      inputSchema: GetComponentPropsInputSchema,
      outputSchema: GetComponentPropsOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (input) => {
      try {
        const parsed = GetComponentPropsInputSchema.parse(input);

        return buildResponse(await service.getProps(parsed));
      } catch (error) {
        return buildErrorResponse('get_component_props', error);
      }
    },
  );
}

export function createComponentsDeps(rootPath = process.cwd()): ComponentsDeps {
  const uiRoot = resolvePath(rootPath, 'packages', 'ui');

  /**
   * Resolves an exports-map target inside `packages/ui`, refusing anything
   * that escapes it. Targets come from a package.json on disk rather than from
   * the caller, but a generated or badly merged `"../../.."` entry would
   * otherwise have this tool read an arbitrary file and stream it to an LLM.
   */
  const resolve = (relativePath: string) => {
    const target = resolvePath(uiRoot, relativePath.replace(/^\.\//, ''));

    if (target !== uiRoot && !target.startsWith(uiRoot + sep)) {
      throw new Error(
        `Refusing to read "${relativePath}": it resolves outside packages/ui.`,
      );
    }

    return target;
  };

  return {
    async readUiPackageJson() {
      const content = await readFile(join(uiRoot, 'package.json'), 'utf8');

      return JSON.parse(content) as { exports?: Record<string, unknown> };
    },
    async readUiFile(relativePath) {
      return readFile(resolve(relativePath), 'utf8');
    },
    async uiFileExists(relativePath) {
      try {
        await access(resolve(relativePath));

        return true;
      } catch {
        return false;
      }
    },
  };
}

function buildResponse<T extends Record<string, unknown>>(result: T) {
  return {
    structuredContent: result,
    content: buildTextContent(JSON.stringify(result)),
  };
}

function buildTextContent(text: string): TextContent[] {
  return [{ type: 'text', text }];
}

function buildErrorResponse(tool: string, error: unknown) {
  return {
    isError: true,
    content: buildTextContent(`${tool} failed: ${toErrorMessage(error)}`),
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

export {
  ComponentsService,
  createComponentsService,
  type ComponentsDeps,
} from './components.service';
export type {
  ComponentCategory,
  ComponentSummary,
  ComponentsSearchOutput,
  GetComponentContentOutput,
  GetComponentPropsOutput,
  GetComponentsOutput,
} from './schema';
