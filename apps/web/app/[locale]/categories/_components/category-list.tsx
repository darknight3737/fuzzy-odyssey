import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

import {
  categoryLabel,
  isTranslatedCategory,
} from '~/lib/directory/category-label';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
};

type CategoryListProps = {
  categories: Category[];
};

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className={'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'}>
      {categories.map((category) => (
        <Link key={category.id} href={`/categories/${category.slug}`}>
          <Card className={'transition-shadow hover:shadow-lg'}>
            <CardHeader>
              <CardTitle className={'flex items-center gap-3'}>
                {category.icon && (
                  <span className={'text-2xl'}>{category.icon}</span>
                )}
                {categoryLabel(category.slug, category.name)}
              </CardTitle>
            </CardHeader>

            {category.description && !isTranslatedCategory(category.slug) && (
              <CardContent>
                <p className={'text-muted-foreground text-sm'}>
                  {category.description}
                </p>
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
