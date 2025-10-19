type Category = {
  name: string;
  slug: string;
  description: string | null;
};

type CategoryHeaderProps = {
  category: Category;
};

export function CategoryHeader({ category }: CategoryHeaderProps) {
  return (
    <div className={'mb-8'}>
      <h1 className={'mb-2 text-4xl font-bold'}>{category.name}</h1>

      {category.description && (
        <p className={'text-lg text-muted-foreground'}>
          {category.description}
        </p>
      )}
    </div>
  );
}

