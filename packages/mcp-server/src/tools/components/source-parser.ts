/**
 * Lightweight source introspection for `@kit/ui` modules.
 *
 * The UI package ships plain source (no build step, no `.d.ts`), and this repo
 * has no usable parser to lean on: `typescript@7` is the native port, which
 * exposes only `{ version, versionMajorMinor }` — there is no
 * `ts.createSourceFile`. So this file scans text.
 *
 * That constraint sets the scope deliberately. We only extract facts a scanner
 * can get *right*, verified against every file in the `@kit/ui` exports map:
 * exported symbol names, barrel re-exports, the `use client` directive, Base UI
 * `render` support, and `cva()` variant tables.
 *
 * We explicitly do NOT try to extract prop types or type-alias bodies. Doing
 * that with a scanner means silently truncating types at the `>` of an `=>`,
 * or at a newline inside a multi-line intersection — and a *wrong* prop type is
 * far worse for a coding agent than no prop type, because nothing signals the
 * omission. Callers that need exact types use `get_component_content`, which
 * returns the authoritative source.
 *
 * Every scanner works on a `Source`: a `mask` in which comment and string
 * bodies are replaced by spaces, paired with the untouched `raw` text. Both
 * strings have identical offsets, so we can match structure against `mask`
 * (no braces or `export` keywords hiding inside a Tailwind class string) while
 * still slicing readable text out of `raw`.
 */

export interface CvaVariantGroup {
  name: string;
  variants: Record<string, string[]>;
  defaults: Record<string, string>;
}

export interface ParsedComponentSource {
  isClientComponent: boolean;
  supportsRenderProp: boolean;
  exports: string[];
  reexports: string[];
  cvaVariants: CvaVariantGroup[];
}

interface Source {
  mask: string;
  raw: string;
}

export function parseComponentSource(content: string): ParsedComponentSource {
  const source: Source = { mask: maskLiterals(content), raw: content };

  return {
    isClientComponent: detectClientComponent(content),
    supportsRenderProp: detectRenderProp(source),
    exports: extractExports(source),
    reexports: extractReexportModules(source),
    cvaVariants: extractCvaVariants(source),
  };
}

function sub(source: Source, start: number, end?: number): Source {
  return {
    mask: source.mask.slice(start, end),
    raw: source.raw.slice(start, end),
  };
}

/**
 * Blanks out comment and string bodies, preserving length (and therefore every
 * offset) as well as newlines.
 *
 * A quote that is never closed before the end of the line is *not* a string:
 * JS string literals cannot contain a raw newline. Without that rule an
 * apostrophe in JSX text (`<p>Don't panic</p>`) would open a phantom string
 * that swallows the rest of the file, hiding every declaration after it.
 */
function maskLiterals(content: string) {
  const out = content.split('');

  let index = 0;
  let state: 'code' | 'line' | 'block' | 'string' | 'template' = 'code';
  let quote = '';
  let stringStart = 0;

  const blank = (from: number, to: number) => {
    for (let i = from; i < to && i < out.length; i++) {
      if (out[i] !== '\n') {
        out[i] = ' ';
      }
    }
  };

  // Restores text blanked as a would-be string once it turns out not to be one.
  const revert = (from: number, to: number) => {
    for (let i = from; i < to && i < out.length; i++) {
      out[i] = content[i]!;
    }
  };

  while (index < content.length) {
    const char = content[index]!;
    const next = content[index + 1];

    if (state === 'code') {
      if (char === '/' && next === '/') {
        state = 'line';
        blank(index, index + 2);
        index += 2;
        continue;
      }

      if (char === '/' && next === '*') {
        state = 'block';
        blank(index, index + 2);
        index += 2;
        continue;
      }

      if (char === '"' || char === "'") {
        state = 'string';
        quote = char;
        stringStart = index;
        index += 1;
        continue;
      }

      if (char === '`') {
        state = 'template';
        index += 1;
        continue;
      }

      index += 1;
      continue;
    }

    if (state === 'line') {
      if (char === '\n') {
        state = 'code';
      } else {
        blank(index, index + 1);
      }

      index += 1;
      continue;
    }

    if (state === 'block') {
      if (char === '*' && next === '/') {
        blank(index, index + 2);
        state = 'code';
        index += 2;
        continue;
      }

      blank(index, index + 1);
      index += 1;
      continue;
    }

    if (state === 'string' && char === '\n') {
      // Unterminated on this line — it was never a string literal.
      revert(stringStart, index);
      state = 'code';
      index += 1;
      continue;
    }

    if (char === '\\') {
      blank(index, index + 2);
      index += 2;
      continue;
    }

    if (
      (state === 'string' && char === quote) ||
      (state === 'template' && char === '`')
    ) {
      state = 'code';
      index += 1;
      continue;
    }

    blank(index, index + 1);
    index += 1;
  }

  if (state === 'string') {
    revert(stringStart, content.length);
  }

  return out.join('');
}

const USE_CLIENT = /^['"]use client['"]/;

/**
 * True when `'use client'` is the first statement.
 *
 * This walks the preamble instead of matching a regex. The obvious pattern —
 * `/^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/` — is
 * exponentially ambiguous: a lazy `[\s\S]*?\*\/` inside a `*`-quantified group
 * can split a run of k block comments 2^(k-1) ways, so a file with ~26 leading
 * block comments and no directive takes seconds to reject, and ~40 takes hours.
 */
function detectClientComponent(content: string) {
  let index = 0;

  while (index < content.length) {
    const char = content[index]!;

    if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
      index += 1;
      continue;
    }

    if (char === '/' && content[index + 1] === '/') {
      const newline = content.indexOf('\n', index);

      if (newline === -1) {
        return false;
      }

      index = newline + 1;
      continue;
    }

    if (char === '/' && content[index + 1] === '*') {
      const end = content.indexOf('*/', index + 2);

      if (end === -1) {
        return false;
      }

      index = end + 2;
      continue;
    }

    return USE_CLIENT.test(content.slice(index, index + 14));
  }

  return false;
}

// Anchored at line start so a commented-out or re-exported import cannot match.
const BASE_UI_IMPORT = /^import\b[^;]*?from\s*['"`]@base-ui\/react/m;

function detectRenderProp(source: Source) {
  // Base UI composition. Every `@base-ui/react` primitive accepts `render`, so
  // importing one is enough; `useRender` and an explicit `render` prop cover
  // the components that compose their own element. Never `asChild` — that is
  // Radix, which this package does not use.
  return (
    BASE_UI_IMPORT.test(source.raw) ||
    /\buseRender\b/.test(source.mask) ||
    /[{,]\s*render\s*[,}]/.test(source.mask) ||
    /\brender\?\s*:/.test(source.mask)
  );
}

const DECLARATION_EXPORT =
  /\bexport\s+(?:declare\s+)?(?:async\s+)?(?:function\s*\*?|const|let|var|class|abstract\s+class|interface|enum|type)\s+([A-Za-z_$][\w$]*)/g;

function extractExports(source: Source) {
  const names = new Set<string>();

  for (const match of source.mask.matchAll(DECLARATION_EXPORT)) {
    names.add(match[1]!);
  }

  if (/\bexport\s+default\b/.test(source.mask)) {
    names.add('default');
  }

  for (const clause of extractExportClauses(source)) {
    for (const specifier of clause.split(',')) {
      const name = readExportedName(specifier);

      if (name) {
        names.add(name);
      }
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}

/** Raw bodies of every `export { ... }` block, including multi-line ones. */
function extractExportClauses(source: Source) {
  const clauses: string[] = [];
  const pattern = /\bexport\s*{/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source.mask)) !== null) {
    const open = match.index + match[0].length - 1;
    const close = findMatching(source.mask, open, '{', '}');

    if (close === -1) {
      continue;
    }

    clauses.push(source.raw.slice(open + 1, close));
    // `close > open`, so `lastIndex` only ever moves forward.
    pattern.lastIndex = close;
  }

  return clauses;
}

function readExportedName(specifier: string) {
  const cleaned = specifier.replace(/\btype\b/g, '').trim();

  if (!cleaned) {
    return undefined;
  }

  // `foo as bar` exports `bar`.
  const parts = cleaned.split(/\s+as\s+/);
  const name = parts[parts.length - 1]!.trim();

  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : undefined;
}

function extractReexportModules(source: Source) {
  const modules = new Set<string>();

  for (const match of source.raw.matchAll(
    /\bexport\s+(?:\*|\{[^}]*\})\s*(?:as\s+[\w$]+\s*)?from\s*['"`]([^'"`]+)['"`]/g,
  )) {
    modules.add(match[1]!);
  }

  return [...modules].sort((a, b) => a.localeCompare(b));
}

/**
 * Brace-aware CVA reader. A regex cannot do this: the base class string holds
 * commas and braces of its own.
 */
function extractCvaVariants(source: Source) {
  const groups: CvaVariantGroup[] = [];
  const pattern = /\bcva\s*\(/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source.mask)) !== null) {
    const open = match.index + match[0].length - 1;
    const close = findMatching(source.mask, open, '(', ')');

    if (close === -1) {
      continue;
    }

    // `cva(base, config)` — the variants live on the config object, which is
    // the first top-level `{ … }` in the argument list.
    const config = readFirstTopLevelObject(sub(source, open + 1, close));

    if (config) {
      const entries = readObjectEntries(config);
      const variants = readVariantGroups(entries);

      if (Object.keys(variants).length > 0) {
        groups.push({
          name: findEnclosingName(source.mask, match.index),
          variants,
          defaults: readDefaultVariants(entries),
        });
      }
    }

    // `close > open`, so `lastIndex` only ever moves forward.
    pattern.lastIndex = close;
  }

  return groups;
}

interface ObjectEntry {
  key: string;
  /** Inner body when the value is an object literal, otherwise undefined. */
  object?: Source;
  /** Raw value text when the value is not an object literal. */
  value?: string;
}

function readVariantGroups(entries: ObjectEntry[]) {
  const block = entries.find((entry) => entry.key === 'variants')?.object;
  const groups: Record<string, string[]> = {};

  if (!block) {
    return groups;
  }

  for (const entry of readObjectEntries(block)) {
    if (entry.object) {
      groups[entry.key] = readObjectEntries(entry.object).map(
        (option) => option.key,
      );
    }
  }

  return groups;
}

function readDefaultVariants(entries: ObjectEntry[]) {
  const block = entries.find(
    (entry) => entry.key === 'defaultVariants',
  )?.object;
  const defaults: Record<string, string> = {};

  if (!block) {
    return defaults;
  }

  for (const entry of readObjectEntries(block)) {
    if (entry.value) {
      defaults[entry.key] = entry.value.replace(/^['"]|['"]$/g, '');
    }
  }

  return defaults;
}

/** The inner body of the first top-level `{ … }` in `text`. */
function readFirstTopLevelObject(text: Source) {
  let depth = 0;

  for (let i = 0; i < text.mask.length; i++) {
    const char = text.mask[i]!;

    if (char === '{' && depth === 0) {
      const close = findMatching(text.mask, i, '{', '}');

      return close === -1 ? undefined : sub(text, i + 1, close);
    }

    if ('([<'.includes(char)) {
      depth += 1;
    } else if (')]>'.includes(char)) {
      depth = Math.max(0, depth - 1);
    }
  }

  return undefined;
}

const OBJECT_KEY = /^(?:'([^']*)'|"([^"]*)"|([\w$-]+))\s*:/;

/**
 * Single pass over one object literal body, returning its top-level entries.
 *
 * Doing keys and values together keeps this linear. Looking each key's value up
 * separately (re-scanning from offset 0 per key) made variant extraction
 * quadratic in the size of the `cva` config.
 */
function readObjectEntries(block: Source): ObjectEntry[] {
  const entries: ObjectEntry[] = [];

  let depth = 0;
  let index = 0;
  let expectKey = true;

  while (index < block.mask.length) {
    const char = block.mask[index]!;

    if ('({['.includes(char)) {
      depth += 1;
      index += 1;
      continue;
    }

    if (')}]'.includes(char)) {
      depth = Math.max(0, depth - 1);
      index += 1;
      continue;
    }

    if (char === ',' && depth === 0) {
      expectKey = true;
      index += 1;
      continue;
    }

    if (depth === 0 && expectKey && !/\s/.test(char)) {
      // Keys may be quoted, and quoted text is blanked in the mask.
      const key = OBJECT_KEY.exec(block.raw.slice(index));

      expectKey = false;

      if (!key) {
        index += 1;
        continue;
      }

      const name = key[1] ?? key[2] ?? key[3]!;
      const valueStart = index + key[0].length;
      const valueOffset = block.mask.slice(valueStart).search(/\S/);

      if (valueOffset === -1) {
        entries.push({ key: name });
        break;
      }

      const start = valueStart + valueOffset;

      if (block.mask[start] === '{') {
        const close = findMatching(block.mask, start, '{', '}');

        if (close === -1) {
          entries.push({ key: name });
          break;
        }

        entries.push({ key: name, object: sub(block, start + 1, close) });
        index = close + 1;
        continue;
      }

      const end = findValueEnd(block.mask, start);

      entries.push({ key: name, value: block.raw.slice(start, end).trim() });
      index = end;
      continue;
    }

    index += 1;
  }

  return entries;
}

/** End of a non-object value: the next depth-zero comma, or end of block. */
function findValueEnd(mask: string, start: number) {
  let depth = 0;

  for (let i = start; i < mask.length; i++) {
    const char = mask[i]!;

    if ('({['.includes(char)) {
      depth += 1;
      continue;
    }

    if (')}]'.includes(char)) {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (char === ',' && depth === 0) {
      return i;
    }
  }

  return mask.length;
}

const DECLARATION_NAME =
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s*\*?|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;

/**
 * Names a `cva()` group after the nearest declaration above it.
 *
 * Usually that is its own binding (`const buttonVariants = cva(…)`). Some
 * components build the table inside a helper instead (`return cva(…)` in
 * `stepper.tsx`), and those variants are still real — naming them after the
 * enclosing function beats dropping them.
 */
function findEnclosingName(mask: string, cvaIndex: number) {
  let name = 'cva';

  DECLARATION_NAME.lastIndex = 0;

  for (const match of mask.matchAll(DECLARATION_NAME)) {
    if (match.index > cvaIndex) {
      break;
    }

    name = match[1]!;
  }

  return name;
}

function findMatching(
  mask: string,
  openIndex: number,
  open: string,
  close: string,
) {
  let depth = 0;

  for (let i = openIndex; i < mask.length; i++) {
    const char = mask[i]!;

    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}
