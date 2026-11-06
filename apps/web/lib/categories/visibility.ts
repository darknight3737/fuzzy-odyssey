type CategoryBranch = { id: string; parent_id: string | null };

export function getCategoryTreeIds(
  categoryId: string,
  categories: CategoryBranch[],
) {
  const ids = new Set([categoryId]);
  for (const id of ids) {
    for (const category of categories) {
      if (category.parent_id === id) ids.add(category.id);
    }
  }
  return ids;
}

export function getPopulatedCategoryIds(
  categories: CategoryBranch[],
  assignedCategoryIds: string[],
) {
  const parents = new Map(categories.map((c) => [c.id, c.parent_id]));
  const populated = new Set<string>();
  for (const assigned of assignedCategoryIds) {
    let id: string | null | undefined = assigned;
    while (id && parents.has(id) && !populated.has(id)) {
      populated.add(id);
      id = parents.get(id);
    }
  }
  return populated;
}
