import Link from 'next/link';

import { categoryLabel } from '~/lib/directory/category-label';
import {
  serviceGroups,
  softwareGroups,
  taxonomyKind,
} from '~/lib/directory/taxonomy';

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

export function CategoryList({ categories }: { categories: Category[] }) {
  const bySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  const renderLink = (category: Category) => (
    <Link
      key={category.slug}
      href={`/categories/${category.slug}`}
      prefetch={false}
      className="text-primary hover:underline"
    >
      {categoryLabel(category.slug, category.name)}
    </Link>
  );

  return (
    <div className="space-y-12">
      {(
        [
          ['Serviços', 'service', serviceGroups],
          ['Software', 'software', softwareGroups],
        ] as const
      ).map(([title, kind, groups]) => (
        <section key={kind} id={kind} className="scroll-mt-24">
          <h2 className="mb-5 text-2xl font-semibold">{title}</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const parent = bySlug.get(group.slug);
              if (!parent) return null;
              return (
                <section key={group.slug} className="rounded-xl border p-5">
                  <h3 className="mb-3 text-lg font-semibold">
                    {renderLink(parent)}
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {categories
                      .filter(
                        (category) =>
                          category.parent_id === parent.id &&
                          taxonomyKind(category.slug) === kind,
                      )
                      .map((category) => (
                        <li key={category.slug}>
                          {renderLink(category)}
                          {kind === 'service' && (
                            <ul className="mt-1 space-y-1 border-l pl-3">
                              {categories
                                .filter(
                                  (child) => child.parent_id === category.id,
                                )
                                .map((child) => (
                                  <li key={child.slug}>{renderLink(child)}</li>
                                ))}
                            </ul>
                          )}
                        </li>
                      ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
