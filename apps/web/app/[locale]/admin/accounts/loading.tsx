import { PageBody } from '@kit/ui/page';

import {
  Delayed,
  PageHeaderSkeleton,
  TableSkeleton,
} from '~/components/skeletons/page-skeletons';

/** A filterable table — the most predictable shape in the app. */
export default function Loading() {
  return (
    <PageBody>
      <Delayed className={'flex flex-col'}>
        <PageHeaderSkeleton withActions />

        <TableSkeleton />
      </Delayed>
    </PageBody>
  );
}
