import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { Skeleton } from '@kit/ui/skeleton';

export function BusinessGridSkeleton() {
  return (
    <div className={'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className={'h-full'}>
          <CardHeader>
            <div className={'mb-3 flex items-start gap-3'}>
              <Skeleton className={'h-12 w-12 rounded'} />
              <div className={'flex-1 space-y-2'}>
                <Skeleton className={'h-5 w-3/4'} />
                <Skeleton className={'h-4 w-1/2'} />
              </div>
            </div>
            <Skeleton className={'h-5 w-24'} />
          </CardHeader>
          <CardContent>
            <div className={'space-y-2'}>
              <Skeleton className={'h-4 w-full'} />
              <Skeleton className={'h-4 w-full'} />
              <Skeleton className={'h-4 w-3/4'} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

