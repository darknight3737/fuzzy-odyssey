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
};

type BusinessGridProps = {
  businesses: Business[];
};

export function BusinessGrid({ businesses }: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <div className={'py-12 text-center'}>
        <p className={'text-muted-foreground'}>
          <Trans
            i18nKey={'categories:noBusinesses'}
            defaults={'No businesses found in this category.'}
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

            {business.description && (
              <CardContent>
                <p className={'line-clamp-3 text-sm text-muted-foreground'}>
                  {business.description}
                </p>
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}

