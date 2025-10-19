import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

type Service = {
  id: string;
  title: string;
  description: string;
  price_range: string | null;
  delivery_time: string | null;
};

type BusinessServicesProps = {
  services: Service[];
};

export function BusinessServices({ services }: BusinessServicesProps) {
  return (
    <div className={'mb-8'}>
      <h2 className={'mb-4 text-2xl font-bold'}>
        <Trans i18nKey={'business:servicesTitle'} defaults={'Services'} />
      </h2>

      <div className={'grid gap-4 md:grid-cols-2'}>
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <CardTitle>{service.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className={'mb-3 text-sm text-muted-foreground'}>
                {service.description}
              </p>

              <div className={'flex gap-4 text-sm'}>
                {service.price_range && (
                  <div>
                    <strong>
                      <Trans
                        i18nKey={'business:priceRange'}
                        defaults={'Price:'}
                      />
                    </strong>{' '}
                    {service.price_range}
                  </div>
                )}

                {service.delivery_time && (
                  <div>
                    <strong>
                      <Trans
                        i18nKey={'business:deliveryTime'}
                        defaults={'Delivery:'}
                      />
                    </strong>{' '}
                    {service.delivery_time}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

