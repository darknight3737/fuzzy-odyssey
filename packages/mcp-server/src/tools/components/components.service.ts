import { describeComponent } from './descriptions';
import type {
  ComponentCategory,
  ComponentSummary,
  ComponentsSearchInput,
  ComponentsSearchOutput,
  GetComponentContentInput,
  GetComponentContentOutput,
  GetComponentPropsInput,
  GetComponentPropsOutput,
  GetComponentsInput,
  GetComponentsOutput,
} from './schema';
import { parseComponentSource } from './source-parser';

export interface ComponentsDeps {
  /** Parsed `packages/ui/package.json`. */
  readUiPackageJson(): Promise<{ exports?: Record<string, unknown> }>;
  /** Reads a file relative to `packages/ui` (e.g. `./src/shadcn/button.tsx`). */
  readUiFile(relativePath: string): Promise<string>;
  /** Whether a `packages/ui`-relative file exists. */
  uiFileExists(relativePath: string): Promise<boolean>;
}

interface ComponentEntry {
  name: string;
  exportPath: string;
  filePath: string;
  category: ComponentCategory;
  description: string;
}

export function createComponentsService(deps: ComponentsDeps) {
  return new ComponentsService(deps);
}

export class ComponentsService {
  constructor(private readonly deps: ComponentsDeps) {}

  async list(input: GetComponentsInput): Promise<GetComponentsOutput> {
    const options = input.state ?? { includeDetails: false };
    const entries = await this.readEntries();

    const filtered = options.category
      ? entries.filter((entry) => entry.category === options.category)
      : entries;

    const components = await Promise.all(
      filtered.map((entry) => this.toSummary(entry, options.includeDetails)),
    );

    return {
      total: components.length,
      counts_by_category: countByCategory(components),
      broken_exports: components
        .filter((component) => !component.exists)
        .map((component) => component.export_path),
      components,
    };
  }

  async search(input: ComponentsSearchInput): Promise<ComponentsSearchOutput> {
    const { query, category, limit } = input.state;
    const term = query.toLowerCase().trim();
    const entries = await this.readEntries();

    const matched = entries
      .filter((entry) => !category || entry.category === category)
      .filter(
        (entry) =>
          entry.name.toLowerCase().includes(term) ||
          entry.description.toLowerCase().includes(term) ||
          entry.category.toLowerCase().includes(term) ||
          entry.filePath.toLowerCase().includes(term),
      )
      // Exact and prefix matches on the export name are what callers usually
      // mean, so surface them before description-only hits.
      .sort(
        (a, b) => rank(a, term) - rank(b, term) || a.name.localeCompare(b.name),
      );

    const limited = matched.slice(0, limit);

    return {
      query,
      total: matched.length,
      components: await Promise.all(
        limited.map((entry) => this.toSummary(entry, false)),
      ),
    };
  }

  async getContent(
    input: GetComponentContentInput,
  ): Promise<GetComponentContentOutput> {
    const entry = await this.requireEntry(input.state.componentName);
    const content = await this.deps.readUiFile(entry.filePath);
    const parsed = parseComponentSource(content);

    return {
      name: entry.name,
      import: importSpecifier(entry.name),
      file_path: entry.filePath,
      category: entry.category,
      description: entry.description,
      client_component: parsed.isClientComponent,
      content,
    };
  }

  async getProps(
    input: GetComponentPropsInput,
  ): Promise<GetComponentPropsOutput> {
    const entry = await this.requireEntry(input.state.componentName);
    const content = await this.deps.readUiFile(entry.filePath);
    const parsed = parseComponentSource(content);

    return {
      name: entry.name,
      import: importSpecifier(entry.name),
      file_path: entry.filePath,
      category: entry.category,
      description: entry.description,
      client_component: parsed.isClientComponent,
      supports_render_prop: parsed.supportsRenderProp,
      exports: parsed.exports,
      reexports: parsed.reexports,
      variants: parsed.cvaVariants,
      notes: buildNotes(entry, parsed.supportsRenderProp),
    };
  }

  private async readEntries(): Promise<ComponentEntry[]> {
    const packageJson = (await this.deps.readUiPackageJson()) ?? {};
    const exports = packageJson.exports;
    const entries: ComponentEntry[] = [];

    // A conforming exports map is a plain object keyed by subpaths. Anything
    // else (a string, an array, null) yields no components rather than
    // nonsense entries like `"0"`.
    if (!exports || typeof exports !== 'object' || Array.isArray(exports)) {
      return entries;
    }

    for (const [exportPath, target] of Object.entries(exports)) {
      if (!exportPath.startsWith('.')) {
        continue;
      }

      const filePath = resolveExportTarget(target);

      if (!filePath) {
        continue;
      }

      const name = exportPath.replace(/^\.\//, '');
      const category = determineCategory(filePath);

      entries.push({
        name,
        exportPath,
        filePath,
        category,
        description: describeComponent(name, category),
      });
    }

    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }

  private async requireEntry(componentName: string) {
    const entries = await this.readEntries();
    const normalized = componentName.trim().replace(/^(?:@kit\/ui\/|\.\/)/, '');
    const entry = entries.find((candidate) => candidate.name === normalized);

    if (!entry) {
      const suggestions = entries
        .filter((candidate) => candidate.name.includes(normalized))
        .slice(0, 5)
        .map((candidate) => candidate.name);

      throw new Error(
        `Component "${componentName}" is not exported by @kit/ui.` +
          (suggestions.length > 0
            ? ` Did you mean: ${suggestions.join(', ')}?`
            : ''),
      );
    }

    return entry;
  }

  private async toSummary(
    entry: ComponentEntry,
    includeDetails: boolean,
  ): Promise<ComponentSummary> {
    const summary: ComponentSummary = {
      name: entry.name,
      import: importSpecifier(entry.name),
      export_path: entry.exportPath,
      file_path: entry.filePath,
      category: entry.category,
      description: entry.description,
      exists: await this.deps.uiFileExists(entry.filePath),
    };

    if (!includeDetails || !summary.exists) {
      return summary;
    }

    try {
      const parsed = parseComponentSource(
        await this.deps.readUiFile(entry.filePath),
      );

      summary.details = {
        exports: parsed.exports,
        reexports: parsed.reexports,
        client_component: parsed.isClientComponent,
        supports_render_prop: parsed.supportsRenderProp,
        variants: parsed.cvaVariants,
      };
    } catch (error) {
      // The file is there (`uiFileExists` said so) but could not be read or
      // parsed — EACCES, a symlink loop, a race with an editor. Report that as
      // its own signal: flipping `exists` here would tell the caller a working
      // export is a broken one, and make `broken_exports` depend on whether
      // details happened to be requested.
      summary.details_error =
        error instanceof Error ? error.message : 'Unknown error';
    }

    return summary;
  }
}

/**
 * `@kit/ui` uses plain string targets today, but conditional exports
 * (`{ import: '...' }`) are valid too — resolve them rather than dropping the
 * entry. Only source modules are relevant, so non-`.ts(x)` targets are skipped.
 */
function resolveExportTarget(target: unknown): string | undefined {
  if (typeof target === 'string') {
    return /\.tsx?$/.test(target) ? target : undefined;
  }

  if (target && typeof target === 'object') {
    for (const key of ['default', 'import', 'require', 'types']) {
      const nested = (target as Record<string, unknown>)[key];
      const resolved = resolveExportTarget(nested);

      if (resolved) {
        return resolved;
      }
    }
  }

  return undefined;
}

function determineCategory(filePath: string): ComponentCategory {
  if (filePath.includes('/shadcn/')) return 'shadcn';
  if (filePath.includes('/makerkit/')) return 'makerkit';
  if (filePath.includes('/base-ui/')) return 'base-ui';
  if (filePath.includes('/hooks/')) return 'hooks';

  return 'utils';
}

function importSpecifier(name: string) {
  return `@kit/ui/${name}`;
}

function rank(entry: ComponentEntry, term: string) {
  if (entry.name === term) return 0;
  if (entry.name.startsWith(term)) return 1;
  if (entry.name.includes(term)) return 2;

  return 3;
}

function countByCategory(components: ComponentSummary[]) {
  const counts: Record<string, number> = {};

  for (const component of components) {
    counts[component.category] = (counts[component.category] ?? 0) + 1;
  }

  return counts;
}

function buildNotes(entry: ComponentEntry, supportsRenderProp: boolean) {
  const notes = [
    `Import with: import { … } from '${importSpecifier(entry.name)}'`,
  ];

  if (supportsRenderProp) {
    notes.push(
      'Base UI composition: use the `render` prop to swap the rendered element (e.g. `render={<Link />}`). `asChild` is Radix-only and is not supported.',
    );
  }

  if (entry.category === 'shadcn') {
    notes.push(
      'This file mirrors upstream shadcn and may be overwritten by the shadcn CLI — put project-specific behaviour in `src/makerkit/` instead.',
    );
  }

  return notes;
}
