import Link from 'next/link';

import { MapPin, Verified } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import { BusinessRating } from './business-rating';

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  tier: string;
  average_rating: number | null;
  review_count: number;
  business_locations?: Array<{
    locations: {
      name: string;
      slug: string;
    } | null;
  }>;
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
      {businesses.map((business) => {
        const primaryLocation = business.business_locations?.find(
          (bl) => bl.locations,
        )?.locations;

        return (
          <Link key={business.id} href={`/company/${business.slug}`}>
            <Card className={'h-full transition-shadow hover:shadow-lg'}>
              <CardHeader>
                <div className={'mb-3 flex items-start justify-between'}>
                  <div className={'flex items-start gap-3'}>
                    {business.logo_url && (
                      // Logos may be hosted on any company domain.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.logo_url}
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        alt={business.name}
                        className={'h-12 w-12 rounded object-cover'}
                      />
                    )}
                    <div className={'flex-1'}>
                      <div className={'mb-1 flex items-center gap-2'}>
                        <CardTitle className={'text-lg'}>
                          {business.name}
                        </CardTitle>
                        {business.tier === 'verified' && (
                          <Verified className={'h-4 w-4 text-blue-500'} />
                        )}
                        {business.tier === 'highlight' && (
                          <Badge variant={'secondary'} className={'text-xs'}>
                            Patrocinado
                          </Badge>
                        )}
                        {business.tier === 'spotlight' && (
                          <Badge variant={'default'} className={'text-xs'}>
                            Patrocinado
                          </Badge>
                        )}
                      </div>
                      {primaryLocation && (
                        <div
                          className={
                            'text-muted-foreground mb-2 flex items-center gap-1 text-sm'
                          }
                        >
                          <MapPin className={'h-3 w-3'} />
                          <span>Located in {primaryLocation.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <BusinessRating
                  rating={business.average_rating}
                  reviewCount={business.review_count}
                />
              </CardHeader>

              {business.description && (
                <CardContent>
                  <p className={'text-muted-foreground line-clamp-3 text-sm'}>
                    {business.description}
                  </p>
                </CardContent>
              )}
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
