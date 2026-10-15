import { describe, expect, it } from 'vitest';

import { createPromptsService, renderTemplate } from '../prompts.service';
import { PROMPT_TEMPLATES } from '../templates';

describe('renderTemplate', () => {
  it('substitutes placeholders and defaults', () => {
    const output = renderTemplate("Hello {{name}}, focus {{focus || 'all'}}.", {
      name: 'Ada',
    });

    expect(output).toBe('Hello Ada, focus all.');
  });

  it('keeps conditional blocks only when the argument is set', () => {
    const template = 'A{{#if flag}} B{{flag}}{{/if}} C';

    expect(renderTemplate(template, { flag: 'x' })).toBe('A Bx C');
    expect(renderTemplate(template, {})).toBe('A C');
  });

  it('renders missing plain placeholders as empty strings', () => {
    expect(renderTemplate('[{{missing}}]', {})).toBe('[]');
  });
});

describe('PromptsService', () => {
  const service = createPromptsService();

  it('exposes the bundled templates', () => {
    expect(service.list()).toBe(PROMPT_TEMPLATES);
    expect(service.get('supabase_rls_policy_design')?.category).toBe(
      'database',
    );
    expect(service.get('nope')).toBeNull();
  });

  it('searches across name, title, description and category', () => {
    expect(service.search('rls').map((p) => p.name)).toEqual([
      'supabase_rls_policy_design',
    ]);
    expect(service.search('database')).toHaveLength(1);
  });

  it('renders a prompt with its arguments', () => {
    const output = service.render('supabase_rls_policy_design', {
      table_name: 'notes',
      access_patterns: 'members only',
      data_sensitivity: 'account-restricted',
    });

    expect(output).toContain('Design RLS policies for table: notes');
    expect(output).toContain('ALTER TABLE notes ENABLE ROW LEVEL SECURITY;');
  });

  it('rejects renders missing required arguments', () => {
    expect(() => service.render('supabase_rls_policy_design', {})).toThrow(
      /missing required arguments: table_name, access_patterns, data_sensitivity/,
    );
  });

  it('throws for unknown prompts', () => {
    expect(() => service.render('nope', {})).toThrow(/not found/);
  });
});
