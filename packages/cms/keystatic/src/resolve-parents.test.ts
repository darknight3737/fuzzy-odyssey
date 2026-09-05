import { describe, expect, it } from 'vitest';

import { resolveParents } from './resolve-parents';

function item(slug: string, parent: string | null = null) {
  return { slug, entry: { parent, title: slug } };
}

describe('resolveParents', () => {
  it('returns a dense array with one result per input item', () => {
    const input = [
      item('guide'),
      item('guide/intro'),
      item('guide/intro-fr', 'guide/intro'),
    ];

    const result = resolveParents(input);

    // `toHaveLength` and `every` both pass on a sparse array, so check the
    // indices directly: `Object.keys` omits holes.
    expect(Object.keys(result)).toEqual(['0', '1', '2']);
    expect(result.map((entry) => entry.slug)).toEqual(
      input.map((entry) => entry.slug),
    );
  });

  it('keeps an explicitly set parent untouched', () => {
    const translated = item('posts/hello-fr', 'posts/hello');

    const [result] = resolveParents([item('posts/hello'), translated]);

    expect(result?.entry.parent).toBeNull();
    expect(resolveParents([translated])[0]?.entry.parent).toBe('posts/hello');
  });

  it('keeps an explicit parent even when it is not in the collection', () => {
    const [result] = resolveParents([item('child', 'missing-parent')]);

    expect(result?.entry.parent).toBe('missing-parent');
  });

  it('treats top-level and index slugs as roots', () => {
    const result = resolveParents([item('guide'), item('guide/guide')]);

    expect(result.map((entry) => entry.entry.parent)).toEqual([null, null]);
  });

  it('prefers the index form of the parent over the plain form', () => {
    const result = resolveParents([
      item('guide'),
      item('guide/guide'),
      item('guide/setup'),
    ]);

    expect(result[2]?.entry.parent).toBe('guide/guide');
  });

  it('falls back to the plain parent slug', () => {
    const result = resolveParents([item('guide'), item('guide/setup')]);

    expect(result[1]?.entry.parent).toBe('guide');
  });

  it('walks up to the closest existing ancestor', () => {
    const result = resolveParents([item('guide'), item('guide/a/b/c')]);

    expect(result[1]?.entry.parent).toBe('guide');
  });

  it('leaves nested items without any ancestor as roots', () => {
    const [result] = resolveParents([item('orphan/deep/page')]);

    expect(result?.entry.parent).toBeNull();
  });

  it('does not mutate the input items', () => {
    const input = [item('guide'), item('guide/setup')];
    const snapshot = structuredClone(input);

    resolveParents(input);

    expect(input).toEqual(snapshot);
  });
});
