import { Trans } from '@kit/ui/trans';

type Category = {
  name: string;
  description: string | null;
};

type Location = {
  name: string;
  type: string;
};

type LocationHeaderProps = {
  category: Category;
  location: Location;
  businessCount: number;
};

export function LocationHeader({
  category,
  location,
  businessCount,
}: LocationHeaderProps) {
  return (
    <div className={'mb-8'}>
      <h1 className={'mb-2 text-4xl font-bold'}>
        <Trans
          i18nKey={'location:heading'}
          values={{ category: category.name, location: location.name }}
          defaults={`Best ${category.name} in ${location.name}`}
        />
      </h1>

      <p className={'mb-4 text-lg text-muted-foreground'}>
        <Trans
          i18nKey={'location:description'}
          values={{
            category: category.name,
            location: location.name,
            count: businessCount,
          }}
          defaults={`Find top ${category.name} providers in ${location.name}. ${businessCount} businesses found.`}
        />
      </p>

      {category.description && (
        <p className={'text-muted-foreground'}>{category.description}</p>
      )}
    </div>
  );
}

