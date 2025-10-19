import { Badge } from '@kit/ui/badge';

type Business = {
  name: string;
  logo_url: string | null;
  cover_image_url: string | null;
  tier: string;
};

type BusinessHeaderProps = {
  business: Business;
};

export function BusinessHeader({ business }: BusinessHeaderProps) {
  return (
    <div className={'mb-8'}>
      {business.cover_image_url && (
        <div className={'mb-6 h-64 w-full overflow-hidden rounded-lg'}>
          <img
            src={business.cover_image_url}
            alt={business.name}
            className={'h-full w-full object-cover'}
          />
        </div>
      )}

      <div className={'flex items-start gap-6'}>
        {business.logo_url && (
          <img
            src={business.logo_url}
            alt={business.name}
            className={'h-24 w-24 rounded-lg object-cover shadow-md'}
          />
        )}

        <div className={'flex-1'}>
          <div className={'mb-2 flex items-center gap-3'}>
            <h1 className={'text-4xl font-bold'}>{business.name}</h1>

            {business.tier !== 'unclaimed' && business.tier !== 'claimed' && (
              <Badge variant={'secondary'} className={'text-sm'}>
                {business.tier}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

