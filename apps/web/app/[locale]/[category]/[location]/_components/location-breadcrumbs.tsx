import Link from 'next/link';

type Category = {
  name: string;
  slug: string;
};

type Location = {
  name: string;
  slug: string;
  type: string;
};

type LocationBreadcrumbsProps = {
  category: Category;
  location: Location;
};

/**
 * Breadcrumb navigation for location pages
 * Per PRD: Breadcrumbs for SEO
 */
export function LocationBreadcrumbs({
  category,
  location,
}: LocationBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="text-muted-foreground flex items-center space-x-2 text-sm">
        <li>
          <Link href="/" className="hover:text-foreground">
            Início
          </Link>
        </li>
        <li>/</li>
        <li>
          <Link
            href={`/categories/${category.slug}`}
            className="hover:text-foreground"
          >
            {category.name}
          </Link>
        </li>
        <li>/</li>
        <li className="text-foreground">{location.name}</li>
      </ol>
    </nav>
  );
}
