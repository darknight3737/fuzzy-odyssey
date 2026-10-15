import { describe, expect, it } from 'vitest';

import type { ComponentsDeps } from '../components.service';
import { registerComponentsToolsWithDeps } from '../index';
import {
  ComponentsSearchOutputSchema,
  GetComponentContentOutputSchema,
  GetComponentPropsOutputSchema,
  GetComponentsOutputSchema,
} from '../schema';

interface RegisteredTool {
  name: string;
  config: Record<string, unknown>;
  handler: (input: unknown) => Promise<Record<string, unknown>>;
}

function createServer() {
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

const deps: ComponentsDeps = {
  async readUiPackageJson() {
    return { exports: { './button': './src/shadcn/button.tsx' } };
  },
  async readUiFile() {
    return `function Button({ className }: ButtonProps) {}\n\nexport { Button };\n`;
  },
  async uiFileExists() {
    return true;
  },
};

function findTool(tools: RegisteredTool[], name: string) {
  const tool = tools.find((candidate) => candidate.name === name);

  if (!tool) {
    throw new Error(`Tool ${name} was not registered`);
  }

  return tool;
}

describe('registerComponentsTools', () => {
  it('registers the four component tools', () => {
    const { server, tools } = createServer();

    registerComponentsToolsWithDeps(server as never, deps);

    expect(tools.map((tool) => tool.name)).toEqual([
      'get_components',
      'components_search',
      'get_component_content',
      'get_component_props',
    ]);
  });

  it('returns structured output matching each output schema', async () => {
    const { server, tools } = createServer();

    registerComponentsToolsWithDeps(server as never, deps);

    const list = await findTool(tools, 'get_components').handler({});
    expect(() =>
      GetComponentsOutputSchema.parse(list.structuredContent),
    ).not.toThrow();

    const search = await findTool(tools, 'components_search').handler({
      state: { query: 'button' },
    });
    expect(() =>
      ComponentsSearchOutputSchema.parse(search.structuredContent),
    ).not.toThrow();

    const content = await findTool(tools, 'get_component_content').handler({
      state: { componentName: 'button' },
    });
    expect(() =>
      GetComponentContentOutputSchema.parse(content.structuredContent),
    ).not.toThrow();

    const props = await findTool(tools, 'get_component_props').handler({
      state: { componentName: 'button' },
    });
    expect(() =>
      GetComponentPropsOutputSchema.parse(props.structuredContent),
    ).not.toThrow();
  });

  it('reports an unknown component as a tool error instead of throwing', async () => {
    const { server, tools } = createServer();

    registerComponentsToolsWithDeps(server as never, deps);

    const result = await findTool(tools, 'get_component_content').handler({
      state: { componentName: 'does-not-exist' },
    });

    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain(
      'get_component_content failed',
    );
  });

  it('declares an input and output schema for every tool', () => {
    const { server, tools } = createServer();

    registerComponentsToolsWithDeps(server as never, deps);

    for (const tool of tools) {
      expect(tool.config.description, tool.name).toBeTruthy();
      expect(tool.config.inputSchema, tool.name).toBeDefined();
      // AGENTS.md #8: structured output is the stable contract.
      expect(tool.config.outputSchema, tool.name).toBeDefined();
    }
  });

  it('mirrors structuredContent in the text content block', async () => {
    const { server, tools } = createServer();

    registerComponentsToolsWithDeps(server as never, deps);

    const result = await findTool(tools, 'get_components').handler({});
    const text = (result.content as { text: string }[])[0]!.text;

    expect(JSON.parse(text)).toEqual(result.structuredContent);
  });

  it('reports invalid input as a tool error', async () => {
    const { server, tools } = createServer();

    registerComponentsToolsWithDeps(server as never, deps);

    const result = await findTool(tools, 'components_search').handler({
      state: { query: '' },
    });

    expect(result.isError).toBe(true);
  });
});
