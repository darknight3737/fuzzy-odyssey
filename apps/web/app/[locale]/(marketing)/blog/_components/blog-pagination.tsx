import Link from 'next/link';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { getBlogPagePath } from '../_lib/blog-page-path';

export function BlogPagination(props: {
  currentPage: number;
  canGoToNextPage: boolean;
  canGoToPreviousPage: boolean;
}) {
  return (
    <div className={'flex items-center space-x-2'}>
      <If condition={props.canGoToPreviousPage}>
        <Button
          variant={'outline'}
          render={<Link href={getBlogPagePath(props.currentPage - 1)} />}
        >
          <ArrowLeft className={'mr-2 h-4'} />
          <Trans i18nKey={'marketing.blogPaginationPrevious'} />
        </Button>
      </If>

      <If condition={props.canGoToNextPage}>
        <Button
          variant={'outline'}
          render={<Link href={getBlogPagePath(props.currentPage + 1)} />}
        >
          <Trans i18nKey={'marketing.blogPaginationNext'} />
          <ArrowRight className={'ml-2 h-4'} />
        </Button>
      </If>
    </div>
  );
}
