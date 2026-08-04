import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { PageBody } from '@kit/ui/page';
import { Skeleton } from '@kit/ui/skeleton';
import { cn } from '@kit/ui/utils';

/**
 * Loading state building blocks. Three rules:
 *
 * 1. Only draw what you can predict — shape and count. Inventing content that
 *    never arrives is worse than showing nothing.
 * 2. Wrap in `Delayed`, or fast navigations flicker.
 * 3. Unknown shape (e.g. chrome chosen at request time) means no skeleton.
 *    Use a neutral indicator instead.
 *
 * From `v4-step/suspense-boundaries` these double as `<Suspense>` fallbacks,
 * where shapes are knowable and surfaces small.
 */

/** Hides children for `delayMs`, then fades in. CSS-only — nothing to hydrate. */
export function Delayed({
  children,
  className,
  delayMs = 200,
}: React.PropsWithChildren<{ className?: string; delayMs?: number }>) {
  return (
    <div
      className={cn('animate-in fade-in duration-200', className)}
      style={{
        animationDelay: `${delayMs}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

/** Matches `PageHeader`. Safe anywhere — every page renders one. */
export function PageHeaderSkeleton({
  withActions = false,
}: {
  withActions?: boolean;
}) {
  return (
    <div
      className={
        'flex flex-col gap-4 py-4 sm:py-5 lg:flex-row lg:items-center lg:justify-between'
      }
    >
      <div className={'flex min-w-0 flex-col gap-y-2'}>
        <Skeleton className={'h-3 w-32'} />
        <Skeleton className={'h-6 w-48'} />
      </div>

      {withActions ? <Skeleton className={'h-9 w-28'} /> : null}
    </div>
  );
}

/** Pass the card count the page actually renders. */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className={'flex flex-col space-y-1.5'}>
        <Skeleton className={'h-5 w-40'} />
        <Skeleton className={'h-3 w-64'} />
      </CardHeader>

      <CardContent className={'flex flex-col space-y-3'}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className={'h-4 w-full'} />
        ))}
      </CardContent>
    </Card>
  );
}

/** Filter row above a bordered table. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={'flex flex-col space-y-4'}>
      <div className={'flex items-center space-x-2'}>
        <Skeleton className={'h-9 w-64'} />
        <Skeleton className={'h-9 w-36'} />
      </div>

      <div className={'flex flex-col space-y-2 rounded-md border p-4'}>
        <Skeleton className={'h-4 w-full'} />

        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className={'h-8 w-full'} />
        ))}
      </div>
    </div>
  );
}

/** Stat tiles above a chart area. */
export function DashboardSkeleton() {
  return (
    <div className={'flex flex-col space-y-4'}>
      <div className={'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={'flex flex-col space-y-2 rounded-md border p-4'}
          >
            <Skeleton className={'h-3 w-20'} />
            <Skeleton className={'h-7 w-24'} />
          </div>
        ))}
      </div>

      <Skeleton className={'h-64 w-full rounded-md'} />
    </div>
  );
}

/** For pages that render a header and nothing else. */
export function PageHeaderOnlySkeleton() {
  return (
    <PageBody>
      <Delayed>
        <PageHeaderSkeleton />
      </Delayed>
    </PageBody>
  );
}
