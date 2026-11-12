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
        <Trans i18nKey={'business.servicesTitle'} defaults={'Services'} />
      </h2>

      <div className={'grid gap-4 md:grid-cols-2'}>
        {services.map((service) => (
          <details key={service.id} className="rounded-xl border p-6">
            <summary className="cursor-pointer font-semibold">
              {service.title}
            </summary>
            <p className="text-muted-foreground mt-3 text-sm">
              {service.description}
            </p>
            {service.price_range && (
              <p className="mt-3 text-sm">
                <strong>Preço:</strong> {service.price_range}
              </p>
            )}
            {service.delivery_time && (
              <p className="mt-2 text-sm">
                <strong>Prazo:</strong> {service.delivery_time}
              </p>
            )}
            <div className="mt-4 flex gap-4 text-sm">
              <a href="#cases" className="underline">
                Ver cases
              </a>
              <a href="#avaliacoes" className="underline">
                Ver avaliações
              </a>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
