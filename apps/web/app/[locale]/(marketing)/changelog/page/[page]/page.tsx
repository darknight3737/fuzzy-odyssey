import {
  getPaginatedStaticParams,
  parsePaginatedPage,
} from '../../../_lib/server/pagination';
import {
  ChangelogListPage,
  getChangelogListMetadata,
} from '../../_components/changelog-list-page';
import { getChangelogPageCount } from '../../_lib/server/load-changelog-entries';

interface ChangelogPaginatedPageProps {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  return getPaginatedStaticParams(await getChangelogPageCount(params.locale));
}

export async function generateMetadata({
  params,
}: ChangelogPaginatedPageProps) {
  return getChangelogListMetadata(parsePaginatedPage((await params).page));
}

function ChangelogPaginatedPage({ params }: ChangelogPaginatedPageProps) {
  return (
    <ChangelogListPage
      page={params.then(({ page }) => parsePaginatedPage(page))}
    />
  );
}

export default ChangelogPaginatedPage;
