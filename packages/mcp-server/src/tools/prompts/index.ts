import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v3';

import { type PromptsDeps, createPromptsService } from './prompts.service';
import type { PromptArgument } from './templates';

export function registerPromptsSystem(
  server: McpServer,
  _rootPath?: string,
  deps?: PromptsDeps,
) {
  const service = createPromptsService(deps);

  for (const template of service.list()) {
    server.registerPrompt(
      template.name,
      {
        title: template.title,
        description: template.description,
        argsSchema: buildArgsSchema(template.arguments),
      },
      async (args: Record<string, string | undefined>) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: service.render(template.name, args),
            },
          },
        ],
      }),
    );
  }
}

function buildArgsSchema(args: PromptArgument[]) {
  const shape: Record<string, z.ZodString | z.ZodOptional<z.ZodString>> = {};

  for (const arg of args) {
    const description = arg.options
      ? `${arg.description}. One of: ${arg.options.join(', ')}`
      : arg.description;

    const base = z.string().describe(description);

    shape[arg.name] = arg.required ? base : base.optional();
  }

  return shape;
}

export {
  createPromptsService,
  renderTemplate,
  type PromptsDeps,
} from './prompts.service';
export { PROMPT_TEMPLATES, type PromptTemplate } from './templates';
