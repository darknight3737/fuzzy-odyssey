import { describe, expect, it } from 'vitest';

import { parseComponentSource } from '../source-parser';

describe('parseComponentSource', () => {
  it('reads CVA variants even when the base class string contains commas', () => {
    const source = `
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex rounded-[min(var(--radius-md),10px)] transition-all",
  {
    variants: {
      variant: {
        default: 'bg-primary',
        outline: 'border-border',
      },
      size: {
        default: 'h-8',
        'icon-xs': "size-6 rounded-[min(var(--radius-md),10px)]",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export { Button, buttonVariants };
`;

    expect(parseComponentSource(source).cvaVariants).toEqual([
      {
        name: 'buttonVariants',
        variants: {
          variant: ['default', 'outline'],
          size: ['default', 'icon-xs'],
        },
        defaults: { variant: 'default', size: 'default' },
      },
    ]);
  });

  it('reads every cva call in a file with more than one', () => {
    const source = `
const aVariants = cva('a', { variants: { tone: { light: '', dark: '' } } });
const bVariants = cva('b', { variants: { size: { sm: '', lg: '' } } });
`;

    expect(
      parseComponentSource(source).cvaVariants.map((group) => group.name),
    ).toEqual(['aVariants', 'bVariants']);
  });

  it('collects symbols from a trailing export block', () => {
    const source = `
function Marker() {}
function MarkerIcon() {}
const markerVariants = null;

export { Marker, MarkerIcon, markerVariants };
`;

    expect(parseComponentSource(source).exports).toEqual([
      'Marker',
      'MarkerIcon',
      'markerVariants',
    ]);
  });

  it('collects inline declaration exports, aliases and default exports', () => {
    const source = `
export function Heading() {}
export const alertExtras = {} as const;
export type AlertExtraVariant = keyof typeof alertExtras;
export interface PageProps {}
const internal = 1;
export { internal as PublicName };
export default Heading;
`;

    const parsed = parseComponentSource(source);

    expect(parsed.exports).toContain('Heading');
    expect(parsed.exports).toContain('alertExtras');
    expect(parsed.exports).toContain('AlertExtraVariant');
    expect(parsed.exports).toContain('PageProps');
    expect(parsed.exports).toContain('PublicName');
    expect(parsed.exports).toContain('default');
    expect(parsed.exports).not.toContain('internal');
  });

  it('records barrel re-exports', () => {
    const source = `
export * from './hero-title';
export { Pill } from './pill';
`;

    expect(parseComponentSource(source).reexports).toEqual([
      './hero-title',
      './pill',
    ]);
  });

  it('detects the use client directive and Base UI render support', () => {
    const client = parseComponentSource(`'use client';

import { useRender } from '@base-ui/react/use-render';
`);

    expect(client.isClientComponent).toBe(true);
    expect(client.supportsRenderProp).toBe(true);

    // Every Base UI primitive accepts `render`, even when the wrapper only
    // spreads props onto it.
    expect(
      parseComponentSource(
        `import { Button as ButtonPrimitive } from '@base-ui/react/button';`,
      ).supportsRenderProp,
    ).toBe(true);

    const server = parseComponentSource(`
// a leading comment does not count as a directive
export function Server() {}
`);

    expect(server.isClientComponent).toBe(false);
    expect(server.supportsRenderProp).toBe(false);
  });

  it('does not claim render support for a commented-out Base UI import', () => {
    const source = `
// import { Button } from '@base-ui/react/button';
export function Plain() {}
`;

    expect(parseComponentSource(source).supportsRenderProp).toBe(false);
  });

  it('ignores export keywords that appear inside comments and strings', () => {
    const source = `
// export { Fake };
const docs = 'export { AlsoFake };';
export function Real() {}
`;

    expect(parseComponentSource(source).exports).toEqual(['Real']);
  });

  // --- regressions ------------------------------------------------------

  it('does not let an apostrophe in JSX text swallow the rest of the file', () => {
    const source = `
export function Alpha() {
  return <p>Don't panic</p>;
}

export function Beta() {}
export const GAMMA = 1;
`;

    // A JS string literal cannot span a raw newline, so the apostrophe must
    // not open one — otherwise every declaration below it disappears.
    expect(parseComponentSource(source).exports).toEqual([
      'Alpha',
      'Beta',
      'GAMMA',
    ]);
  });

  it('still masks genuine single-line strings', () => {
    const source = `
const a = 'export function Fake() {}';
export function Real() {}
`;

    expect(parseComponentSource(source).exports).toEqual(['Real']);
  });

  it('rejects a long block-comment preamble without exponential backtracking', () => {
    // A regex with a lazy quantifier inside a `*` group takes seconds at 26
    // blocks and hours at 40. This must stay linear.
    const source = `${Array(400).fill('/* eslint-disable a-rule */').join('\n')}\nexport const A = 1;\n`;

    const startedAt = Date.now();
    const parsed = parseComponentSource(source);

    expect(parsed.isClientComponent).toBe(false);
    expect(Date.now() - startedAt).toBeLessThan(500);
  });

  it('finds a directive that follows a licence header', () => {
    const source = `/**
 * Copyright.
 */
// a line comment
'use client';

export function A() {}
`;

    expect(parseComponentSource(source).isClientComponent).toBe(true);
  });

  it('terminates on unbalanced and truncated input', () => {
    for (const source of [
      'export const a = cva("x", { variants: { v: { a: "" }',
      'const x = "unterminated',
      'export {',
      '/* unterminated',
      'type T = (e: Event) => void;',
      'a'.repeat(5000),
    ]) {
      const startedAt = Date.now();

      expect(() => parseComponentSource(source)).not.toThrow();
      expect(Date.now() - startedAt).toBeLessThan(500);
    }
  });

  it('keeps a large cva variants table linear rather than quadratic', () => {
    const entries = Array.from(
      { length: 2000 },
      (_, index) => `k${index}: { x: "" }`,
    ).join(', ');

    const startedAt = Date.now();
    const parsed = parseComponentSource(
      `const s = cva("b", { variants: { ${entries} } });`,
    );

    expect(Object.keys(parsed.cvaVariants[0]!.variants)).toHaveLength(2000);
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});
