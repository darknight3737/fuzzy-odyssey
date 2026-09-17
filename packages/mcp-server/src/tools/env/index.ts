import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  DESTRUCTIVE_TOOL,
  IDEMPOTENT_MUTATING_TOOL,
  READ_ONLY_TOOL,
} from '../../lib/tool-response';
import {
  type KitEnvDeps,
  createKitEnvDeps,
  createKitEnvService,
} from './kit-env.service';
import {
  KitEnvRawReadInputSchema,
  KitEnvRawReadOutputSchema,
  KitEnvRawWriteInputSchema,
  KitEnvRawWriteOutputSchema,
  KitEnvReadInputSchema,
  KitEnvReadOutputSchema,
  KitEnvSchemaInputSchema,
  KitEnvSchemaOutputSchema,
  KitEnvUpdateInputSchema,
  KitEnvUpdateOutputSchema,
} from './schema';

type TextContent = {
  type: 'text';
  text: string;
};

export function registerKitEnvTools(server: McpServer, rootPath?: string) {
  const service = createKitEnvService(createKitEnvDeps(rootPath));

  server.registerTool(
    'kit_env_schema',
    {
      description: 'Return environment variable schema for this kit variant',
      inputSchema: KitEnvSchemaInputSchema,
      outputSchema: KitEnvSchemaOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async () => {
      try {
        const result = await service.getSchema();

        return {
          structuredContent: result,
          content: buildTextContent(JSON.stringify(result)),
        };
      } catch (error) {
        return buildErrorResponse('kit_env_schema', error);
      }
    },
  );

  server.registerTool(
    'kit_env_read',
    {
      description: 'Read environment variables and validation state',
      inputSchema: KitEnvReadInputSchema,
      outputSchema: KitEnvReadOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (input) => {
      try {
        const parsed = KitEnvReadInputSchema.parse(input);
        const result = await service.read(parsed.mode);

        return {
          structuredContent: result,
          content: buildTextContent(JSON.stringify(result)),
        };
      } catch (error) {
        return buildErrorResponse('kit_env_read', error);
      }
    },
  );

  server.registerTool(
    'kit_env_update',
    {
      description: 'Update one environment variable in a target .env file',
      inputSchema: KitEnvUpdateInputSchema,
      outputSchema: KitEnvUpdateOutputSchema,
      annotations: IDEMPOTENT_MUTATING_TOOL,
    },
    async (input) => {
      try {
        const parsed = KitEnvUpdateInputSchema.parse(input);
        const result = await service.update(parsed);

        return {
          structuredContent: result,
          content: buildTextContent(JSON.stringify(result)),
        };
      } catch (error) {
        return buildErrorResponse('kit_env_update', error);
      }
    },
  );

  server.registerTool(
    'kit_env_raw_read',
    {
      description: 'Read raw content of an .env file',
      inputSchema: KitEnvRawReadInputSchema,
      outputSchema: KitEnvRawReadOutputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (input) => {
      try {
        const parsed = KitEnvRawReadInputSchema.parse(input);
        const result = await service.rawRead(parsed.file);

        return {
          structuredContent: result,
          content: buildTextContent(JSON.stringify(result)),
        };
      } catch (error) {
        return buildErrorResponse('kit_env_raw_read', error);
      }
    },
  );

  server.registerTool(
    'kit_env_raw_write',
    {
      description: 'Write raw content to an .env file',
      inputSchema: KitEnvRawWriteInputSchema,
      outputSchema: KitEnvRawWriteOutputSchema,
      annotations: DESTRUCTIVE_TOOL,
    },
    async (input) => {
      try {
        const parsed = KitEnvRawWriteInputSchema.parse(input);
        const result = await service.rawWrite(parsed.file, parsed.content);

        return {
          structuredContent: result,
          content: buildTextContent(JSON.stringify(result)),
        };
      } catch (error) {
        return buildErrorResponse('kit_env_raw_write', error);
      }
    },
  );
}

function buildErrorResponse(tool: string, error: unknown) {
  const message = `${tool} failed: ${toErrorMessage(error)}`;

  return {
    isError: true,
    content: buildTextContent(message),
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

function buildTextContent(text: string): TextContent[] {
  return [{ type: 'text', text }];
}

export {
  createKitEnvService,
  createKitEnvDeps,
  envVariables,
  findWorkspaceRoot,
  scanMonorepoEnv,
  processEnvDefinitions,
  getEnvState,
  getVariable,
} from './public-api';
export type { KitEnvDeps };
export type { EnvVariableModel } from './model';
export type {
  EnvMode,
  AppEnvState,
  EnvFileInfo,
  EnvVariableState,
} from './types';
