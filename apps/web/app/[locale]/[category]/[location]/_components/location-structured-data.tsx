import appConfig from '~/config/app.config';
import { serializeJsonLd } from '~/lib/seo';

type Category = {
  name: string;
  slug: string;
};

type Location = {
  name: string;
  slug: string;
  type: string;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
};

type LocationStructuredDataProps = {
  category: Category;
  location: Location;
  businesses: Business[];
};

/**
 * Structured data (JSON-LD) for SEO
 * Per PRD: Schema: ItemList, LocalBusiness for each provider
 */
export function LocationStructuredData({
  category,
  location,
  businesses,
}: LocationStructuredDataProps) {
  const pageUrl = `${appConfig.url}/${category.slug}/${location.slug}`;

  // ItemList schema for the business listings
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} em ${location.name}`,
    description: `Encontre empresas de ${category.name} em ${location.name}`,
    url: pageUrl,
    numberOfItems: businesses.length,
    itemListElement: businesses.map((business, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `${appConfig.url}/company/${business.slug}`,
        name: business.name,
        description: business.description || undefined,
        image: business.logo_url || undefined,
        url: `${appConfig.url}/company/${business.slug}`,
      },
    })),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: appConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `${appConfig.url}/categories/${category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: location.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
    </>
  );
}
