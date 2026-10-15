import { describe, expect, it } from 'vitest';

import {
  type ComponentsDeps,
  createComponentsService,
} from '../components.service';

const BUTTON_SOURCE = `import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('inline-flex', {
  variants: {
    variant: { default: 'a', outline: 'b' },
  },
});

function Button({ className, ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {}

export { Button, buttonVariants };
`;

const UTILS_SOURCE = `export function cn(...inputs: ClassValue[]) {}
`;

const HOOK_SOURCE = `'use client';

export function useMobile() {}
`;

function createDeps(overrides: Partial<ComponentsDeps> = {}): ComponentsDeps {
  const files: Record<string, string> = {
    './src/shadcn/button.tsx': BUTTON_SOURCE,
    './src/lib/utils/index.ts': UTILS_SOURCE,
    './src/hooks/use-mobile.ts': HOOK_SOURCE,
  };

  return {
    async readUiPackageJson() {
      return {
        exports: {
          './button': './src/shadcn/button.tsx',
          './utils': './src/lib/utils/index.ts',
          './hooks/use-mobile': './src/hooks/use-mobile.ts',
          './broken': './src/hooks/missing.ts',
          './styles.css': './src/styles.css',
        },
      };
    },
    async readUiFile(relativePath) {
      const content = files[relativePath];

      if (content === undefined) {
        throw new Error(`ENOENT: ${relativePath}`);
      }

      return content;
    },
    async uiFileExists(relativePath) {
      return relativePath in files;
    },
    ...overrides,
  };
}

describe('ComponentsService', () => {
  it('includes non-tsx source exports that the old tsx-only filter dropped', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.list({ state: { includeDetails: false } });

    const names = result.components.map((component) => component.name);

    expect(names).toContain('utils');
    expect(names).toContain('hooks/use-mobile');
    // Non-source targets are not components.
    expect(names).not.toContain('styles.css');
  });

  it('categorises by folder and exposes the import specifier', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.list({ state: { includeDetails: false } });

    const button = result.components.find(
      (component) => component.name === 'button',
    );

    expect(button).toMatchObject({
      category: 'shadcn',
      import: '@kit/ui/button',
      export_path: './button',
      exists: true,
    });

    expect(result.counts_by_category).toMatchObject({
      shadcn: 1,
      hooks: 2,
      utils: 1,
    });
  });

  it('reports exports whose target file is missing', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.list({ state: { includeDetails: false } });

    expect(result.broken_exports).toEqual(['./broken']);
  });

  it('filters by category and can include parsed details', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.list({
      state: { category: 'shadcn', includeDetails: true },
    });

    expect(result.total).toBe(1);
    expect(result.components[0]?.details).toMatchObject({
      exports: ['Button', 'buttonVariants'],
      client_component: false,
      variants: [
        {
          name: 'buttonVariants',
          variants: { variant: ['default', 'outline'] },
        },
      ],
    });
  });

  it('ranks exact and prefix name matches above description matches', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.search({
      state: { query: 'button', limit: 50 },
    });

    expect(result.components[0]?.name).toBe('button');
    expect(result.total).toBeGreaterThan(0);
  });

  it('honours the search limit', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.search({ state: { query: 'u', limit: 1 } });

    expect(result.components).toHaveLength(1);
    expect(result.total).toBeGreaterThan(1);
  });

  it('returns source content and the client-component flag', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.getContent({
      state: { componentName: 'hooks/use-mobile' },
    });

    expect(result.client_component).toBe(true);
    expect(result.content).toBe(HOOK_SOURCE);
    expect(result.import).toBe('@kit/ui/hooks/use-mobile');
  });

  it('accepts a fully qualified import specifier as the component name', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.getContent({
      state: { componentName: '@kit/ui/button' },
    });

    expect(result.name).toBe('button');
  });

  it('suggests near matches for an unknown component', async () => {
    const service = createComponentsService(createDeps());

    await expect(
      service.getContent({ state: { componentName: 'butto' } }),
    ).rejects.toThrow(/Did you mean: button/);
  });

  it('surfaces exports, variants and shadcn ownership notes in props output', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.getProps({
      state: { componentName: 'button' },
    });

    expect(result.exports).toEqual(['Button', 'buttonVariants']);
    expect(result.variants[0]?.name).toBe('buttonVariants');
    expect(result.notes.join(' ')).toContain('shadcn CLI');
    expect(result.notes.join(' ')).toContain("from '@kit/ui/button'");
  });

  it('reports an unreadable file as a details error, not a missing export', async () => {
    const service = createComponentsService(
      createDeps({
        async uiFileExists() {
          return true;
        },
        async readUiFile() {
          throw new Error('EACCES: permission denied');
        },
      }),
    );

    const result = await service.list({ state: { includeDetails: true } });
    const button = result.components.find(
      (component) => component.name === 'button',
    );

    // The file is present; only reading it failed. Flipping `exists` here
    // would make broken_exports depend on whether details were requested.
    expect(button?.exists).toBe(true);
    expect(button?.details).toBeUndefined();
    expect(button?.details_error).toContain('EACCES');
    expect(result.broken_exports).toEqual([]);
  });

  it('filters search results by category', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.search({
      state: { query: 'u', category: 'hooks', limit: 50 },
    });

    expect(result.components.length).toBeGreaterThan(0);
    expect(
      result.components.every((component) => component.category === 'hooks'),
    ).toBe(true);
  });

  it('normalises a component name with surrounding whitespace', async () => {
    const service = createComponentsService(createDeps());
    const result = await service.getContent({
      state: { componentName: '  @kit/ui/button  ' },
    });

    expect(result.name).toBe('button');
  });

  it('yields no components when the exports map is not a subpath object', async () => {
    for (const exports of [
      undefined,
      null,
      'a string',
      ['./src/shadcn/button.tsx'],
      { notASubpath: './src/shadcn/button.tsx' },
    ]) {
      const service = createComponentsService(
        createDeps({
          async readUiPackageJson() {
            return { exports } as never;
          },
        }),
      );

      const result = await service.list({ state: { includeDetails: false } });

      expect(result.components).toEqual([]);
    }
  });

  it('resolves conditional export targets', async () => {
    const service = createComponentsService(
      createDeps({
        async readUiPackageJson() {
          return {
            exports: {
              './button': { import: './src/shadcn/button.tsx' },
            },
          };
        },
      }),
    );

    const result = await service.list({ state: { includeDetails: false } });

    expect(result.components[0]?.file_path).toBe('./src/shadcn/button.tsx');
  });
});
