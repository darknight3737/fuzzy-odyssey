import { Skeleton } from '@kit/ui/skeleton';

import { Delayed } from '~/components/skeletons/page-skeletons';

/** The shell provides the card and logo; only the form area needs a placeholder. */
export default function Loading() {
  return (
    <Delayed className={'flex w-full flex-col space-y-4'}>
      <Skeleton className={'h-6 w-40 self-center'} />

      <Skeleton className={'h-10 w-full'} />
      <Skeleton className={'h-10 w-full'} />

      <Skeleton className={'h-10 w-full'} />
    </Delayed>
  );
}
