import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

type Business = {
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  employee_count: number | null;
  founded_year: number | null;
  business_languages: string[] | null;
  works_remotely: boolean;
  business_categories?: Array<{
    categories: { name: string; slug: string } | null;
  }>;
  business_locations?: Array<{
    locations: { name: string; slug: string } | null;
  }>;
};

type BusinessInfoProps = {
  business: Business;
};

export function BusinessInfo({ business }: BusinessInfoProps) {
  return (
    <div className={'mb-8 grid gap-6 md:grid-cols-3'}>
      <Card className={'md:col-span-2'}>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey={'business:aboutTitle'} defaults={'About'} />
          </CardTitle>
        </CardHeader>

        <CardContent>
          {business.description && (
            <p className={'mb-4 text-muted-foreground'}>
              {business.description}
            </p>
          )}

          <div className={'space-y-2'}>
            {business.website && (
              <div>
                <strong className={'text-sm'}>
                  <Trans i18nKey={'business:website'} defaults={'Website:'} />
                </strong>{' '}
                <a
                  href={business.website}
                  target={'_blank'}
                  rel={'noopener noreferrer'}
                  className={'text-primary hover:underline'}
                >
                  {business.website}
                </a>
              </div>
            )}

            {business.phone && (
              <div>
                <strong className={'text-sm'}>
                  <Trans i18nKey={'business:phone'} defaults={'Phone:'} />
                </strong>{' '}
                <a href={`tel:${business.phone}`} className={'text-primary'}>
                  {business.phone}
                </a>
              </div>
            )}

            {business.email && (
              <div>
                <strong className={'text-sm'}>
                  <Trans i18nKey={'business:email'} defaults={'Email:'} />
                </strong>{' '}
                <a
                  href={`mailto:${business.email}`}
                  className={'text-primary'}
                >
                  {business.email}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey={'business:detailsTitle'} defaults={'Details'} />
          </CardTitle>
        </CardHeader>

        <CardContent className={'space-y-4'}>
          {business.business_categories &&
            business.business_categories.length > 0 && (
              <div>
                <strong className={'mb-2 block text-sm'}>
                  <Trans
                    i18nKey={'business:categories'}
                    defaults={'Categories:'}
                  />
                </strong>

                <div className={'flex flex-wrap gap-2'}>
                  {business.business_categories.map(
                    (bc, idx) =>
                      bc.categories && (
                        <Badge key={idx} variant={'outline'}>
                          {bc.categories.name}
                        </Badge>
                      ),
                  )}
                </div>
              </div>
            )}

          {business.business_locations &&
            business.business_locations.length > 0 && (
              <div>
                <strong className={'mb-2 block text-sm'}>
                  <Trans
                    i18nKey={'business:locations'}
                    defaults={'Locations:'}
                  />
                </strong>

                <div className={'flex flex-wrap gap-2'}>
                  {business.business_locations.map(
                    (bl, idx) =>
                      bl.locations && (
                        <Badge key={idx} variant={'outline'}>
                          {bl.locations.name}
                        </Badge>
                      ),
                  )}
                </div>
              </div>
            )}

          {business.employee_count && (
            <div>
              <strong className={'text-sm'}>
                <Trans
                  i18nKey={'business:employees'}
                  defaults={'Employees:'}
                />
              </strong>{' '}
              {business.employee_count}
            </div>
          )}

          {business.founded_year && (
            <div>
              <strong className={'text-sm'}>
                <Trans i18nKey={'business:founded'} defaults={'Founded:'} />
              </strong>{' '}
              {business.founded_year}
            </div>
          )}

          {business.works_remotely && (
            <div>
              <Badge variant={'secondary'}>
                <Trans
                  i18nKey={'business:worksRemotely'}
                  defaults={'Works Remotely'}
                />
              </Badge>
            </div>
          )}

          {business.business_languages &&
            business.business_languages.length > 0 && (
              <div>
                <strong className={'mb-2 block text-sm'}>
                  <Trans
                    i18nKey={'business:languages'}
                    defaults={'Languages:'}
                  />
                </strong>

                <div className={'flex flex-wrap gap-2'}>
                  {business.business_languages.map((lang, idx) => (
                    <Badge key={idx} variant={'outline'}>
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

