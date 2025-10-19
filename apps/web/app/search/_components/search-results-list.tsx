import Link from 'next/link';

import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  tier: string;
  business_categories?: Array<{
    categories: { name: string; slug: string } | null;
  }>;
  business_locations?: Array<{ locations: { name: string } | null }>;
};

type SearchResultsListProps = {
  businesses: Business[];
};

export function SearchResultsList({ businesses }: SearchResultsListProps) {
  if (businesses.length === 0) {
    return (
      <div className={'py-12 text-center'}>
        <p className={'text-muted-foreground'}>
          <Trans
            i18nKey={'search:noResults'}
            defaults={'No businesses found. Try adjusting your search.'}
          />
        </p>
      </div>
    );
  }

  return (
    <div className={'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'}>
      {businesses.map((business) => (
        <Link key={business.id} href={`/company/${business.slug}`}>
          <Card className={'h-full transition-shadow hover:shadow-lg'}>
            <CardHeader>
              <div className={'mb-2 flex items-start justify-between'}>
                {business.logo_url && (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className={'h-12 w-12 rounded object-cover'}
                  />
                )}

                {business.tier !== 'unclaimed' && business.tier !== 'claimed' && (
                  <Badge variant={'secondary'}>{business.tier}</Badge>
                )}
              </div>

              <CardTitle>{business.name}</CardTitle>
            </CardHeader>

            <CardContent>
              {business.description && (
                <p className={'mb-3 line-clamp-3 text-sm text-muted-foreground'}>
                  {business.description}
                </p>
              )}

              {business.business_categories &&
                business.business_categories.length > 0 && (
                  <div className={'flex flex-wrap gap-1'}>
                    {business.business_categories.slice(0, 2).map(
                      (bc, idx) =>
                        bc.categories && (
                          <Badge key={idx} variant={'outline'} className={'text-xs'}>
                            {bc.categories.name}
                          </Badge>
                        ),
                    )}
                  </div>
                )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

