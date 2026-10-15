import { describe, expect, it } from 'vitest';

import { createComponentsService } from '../components.service';
import { COMPONENT_DESCRIPTIONS } from '../descriptions';
import { createComponentsDeps } from '../index';

import { fileURLToPath } from 'node:url';

/**
 * These tests run against the real `packages/ui`, which is the point: this
 * tool's whole job is to describe that package accurately, and every failure
 * mode found in review was invisible to fixture-based tests.
 */
const WORKSPACE_ROOT = fileURLToPath(
  new URL('../../../../../../', import.meta.url),
);

const service = createComponentsService(createComponentsDeps(WORKSPACE_ROOT));

describe('@kit/ui corpus', () => {
  it('resolves every export in packages/ui/package.json to a file on disk', async () => {
    const result = await service.list({ state: { includeDetails: false } });

    expect(result.total).toBeGreaterThan(80);
    // A non-empty list here means an exports entry points at a missing file.
    expect(result.broken_exports).toEqual([]);
  });

  it('has a curated description for every export, and no orphans', async () => {
    const result = await service.list({ state: { includeDetails: false } });

    const exported = result.components
      .map((component) => component.name)
      .sort();
    const described = Object.keys(COMPONENT_DESCRIPTIONS).sort();

    // Drift guard. Adding an export to @kit/ui without a description here (or
    // leaving a description behind after removing one) fails this test.
    expect(described).toEqual(exported);
  });

  it('parses every export file without throwing or timing out', async () => {
    const startedAt = Date.now();
    const result = await service.list({ state: { includeDetails: true } });

    const failures = result.components
      .filter((component) => component.details_error)
      .map((component) => `${component.name}: ${component.details_error}`);

    expect(failures).toEqual([]);
    expect(
      result.components.every((component) => component.details !== undefined),
    ).toBe(true);
    expect(Date.now() - startedAt).toBeLessThan(5000);
  });

  it('reports exported symbols for every module that declares any', async () => {
    const result = await service.list({ state: { includeDetails: true } });

    // A module with neither exports nor re-exports means the scanner lost the
    // file — the failure mode that a masking bug produces.
    const silent = result.components.filter(
      (component) =>
        component.details!.exports.length === 0 &&
        component.details!.reexports.length === 0,
    );

    expect(silent.map((component) => component.name)).toEqual([]);
  });

  it('extracts the real Button variants', async () => {
    const result = await service.getProps({
      state: { componentName: 'button' },
    });

    expect(result.exports).toEqual(['Button', 'buttonVariants']);

    const variants = result.variants[0]!;

    expect(variants.name).toBe('buttonVariants');
    expect(variants.variants.variant).toEqual(
      expect.arrayContaining(['default', 'outline', 'ghost', 'destructive']),
    );
    expect(variants.defaults).toEqual({ variant: 'default', size: 'default' });
  });

  it('reports the Sidebar context module without truncating its exports', async () => {
    const result = await service.getProps({
      state: { componentName: 'sidebar' },
    });

    // sidebar.tsx is the largest file in the package and the one that exposed
    // the truncation bugs in review.
    expect(result.exports).toEqual(
      expect.arrayContaining([
        'Sidebar',
        'SidebarProvider',
        'SidebarTrigger',
        'useSidebar',
      ]),
    );
    expect(result.client_component).toBe(true);
  });

  it('surfaces barrel re-exports for the marketing module', async () => {
    const result = await service.getProps({
      state: { componentName: 'marketing' },
    });

    expect(result.reexports).toEqual(
      expect.arrayContaining(['./hero', './footer', './feature-grid']),
    );
  });
});

describe('@kit/ui cva coverage', () => {
  it('finds variants in every file that declares a cva table', async () => {
    const result = await service.list({ state: { includeDetails: true } });

    const named = result.components.filter(
      (component) => component.details!.variants.length > 0,
    );

    // Regression guard: the previous implementation's `cva\([^,]*,` regex
    // matched 0 of these, because real base-class strings contain commas.
    expect(named.length).toBeGreaterThanOrEqual(16);

    const stepper = result.components.find(
      (component) => component.name === 'stepper',
    );

    // stepper builds its table via `return cva(...)` inside a helper rather
    // than binding it to a const.
    expect(stepper!.details!.variants[0]!.variants.variant).toEqual([
      'default',
      'numbers',
      'dots',
    ]);
  });
});
