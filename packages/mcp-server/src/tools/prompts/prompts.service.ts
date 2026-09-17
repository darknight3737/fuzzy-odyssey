import { PROMPT_TEMPLATES, type PromptTemplate } from './templates';

export interface PromptsDeps {
  templates: PromptTemplate[];
}

export function createPromptsService(
  deps: PromptsDeps = { templates: PROMPT_TEMPLATES },
) {
  return new PromptsService(deps);
}

export class PromptsService {
  constructor(private readonly deps: PromptsDeps) {}

  list(): PromptTemplate[] {
    return this.deps.templates;
  }

  listByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return this.deps.templates.filter((prompt) => prompt.category === category);
  }

  get(name: string): PromptTemplate | null {
    return this.deps.templates.find((prompt) => prompt.name === name) ?? null;
  }

  search(query: string): PromptTemplate[] {
    const term = query.toLowerCase();

    return this.deps.templates.filter((prompt) =>
      [prompt.name, prompt.title, prompt.description, prompt.category].some(
        (field) => field.toLowerCase().includes(term),
      ),
    );
  }

  render(name: string, args: Record<string, string | undefined>): string {
    const prompt = this.get(name);

    if (!prompt) {
      throw new Error(`Prompt "${name}" not found`);
    }

    const missing = prompt.arguments
      .filter((arg) => arg.required && !args[arg.name])
      .map((arg) => arg.name);

    if (missing.length > 0) {
      throw new Error(
        `Prompt "${name}" is missing required arguments: ${missing.join(', ')}`,
      );
    }

    return renderTemplate(prompt.template, args);
  }
}

/**
 * Minimal Handlebars-like renderer supporting:
 * - `{{name}}`
 * - `{{name || 'default'}}`
 * - `{{#if name}}...{{/if}}`
 *
 * Conditionals are resolved first so a placeholder inside a skipped block is
 * never rendered as an empty string.
 */
export function renderTemplate(
  template: string,
  args: Record<string, string | undefined>,
): string {
  let rendered = template.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, name: string, content: string) => (args[name] ? content : ''),
  );

  rendered = rendered.replace(
    /\{\{(\w+)\s*\|\|\s*'([^']*)'\}\}/g,
    (_match, name: string, fallback: string) => args[name] || fallback,
  );

  rendered = rendered.replace(
    /\{\{(\w+)\}\}/g,
    (_match, name: string) => args[name] ?? '',
  );

  return rendered.trim();
}
