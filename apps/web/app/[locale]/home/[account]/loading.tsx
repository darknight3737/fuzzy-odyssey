import { PageBody } from '@kit/ui/page';

import {
  DashboardSkeleton,
  Delayed,
  PageHeaderSkeleton,
} from '~/components/skeletons/page-skeletons';

/** Header above a dashboard. Renders inside the layout, so chrome stays put. */
export default function Loading() {
  return (
    <PageBody>
      <Delayed className={'flex flex-col'}>
        <PageHeaderSkeleton />

        <DashboardSkeleton />
      </Delayed>
    </PageBody>
  );
}
