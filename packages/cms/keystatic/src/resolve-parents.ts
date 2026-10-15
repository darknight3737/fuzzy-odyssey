type ItemWithParent = {
  slug: string;
  entry: {
    parent: string | null;
  };
};

/**
 * @name resolveParents
 * @description Fill in the `parent` of every item that does not declare one
 * explicitly, based on the slug hierarchy of the collection.
 *
 * Items that already declare a parent are returned untouched.
 *
 * Resolution rules for a slug like `a/b/c`:
 * 1. Index files (`a`, or `a/b/b`) are roots and get no parent.
 * 2. Otherwise the closest existing ancestor wins, preferring the index
 *    form (`a/b/b`) over the plain form (`a/b`) at every level.
 * 3. If no ancestor exists in the collection the item becomes a root.
 *
 * The function never mutates its input and never produces holes.
 */
export function resolveParents<T extends ItemWithParent>(items: T[]) {
  const slugSet = new Set(items.map((item) => item.slug));

  return items.map((item) => {
    if (item.entry.parent !== null) {
      return item;
    }

    const parent = isIndexSlug(item.slug)
      ? null
      : findClosestParent(item.slug, slugSet);

    return {
      ...item,
      entry: { ...item.entry, parent },
    };
  });
}

function isIndexSlug(slug: string) {
  const parts = slug.split('/');

  return (
    parts.length === 1 || parts[parts.length - 1] === parts[parts.length - 2]
  );
}

function findClosestParent(slug: string, slugSet: Set<string>) {
  const parts = slug.split('/');

  for (let i = parts.length - 1; i > 0; i--) {
    const parentParts = parts.slice(0, i);
    const lastPart = parentParts[parentParts.length - 1];

    if (!lastPart) {
      continue;
    }

    const indexParent = [...parentParts, lastPart].join('/');

    if (slugSet.has(indexParent)) {
      return indexParent;
    }

    const plainParent = parentParts.join('/');

    if (slugSet.has(plainParent)) {
      return plainParent;
    }
  }

  return null;
}
