import {
  getPaginatedStaticParams,
  parsePaginatedPage,
} from '../../../_lib/server/pagination';
import {
  BlogListPage,
  getBlogListMetadata,
} from '../../_components/blog-list-page';
import { getBlogPageCount } from '../../_lib/server/load-blog-posts';

interface BlogPaginatedPageProps {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  return getPaginatedStaticParams(await getBlogPageCount(params.locale));
}

export async function generateMetadata({ params }: BlogPaginatedPageProps) {
  return getBlogListMetadata(parsePaginatedPage((await params).page));
}

function BlogPaginatedPage({ params }: BlogPaginatedPageProps) {
  return (
    <BlogListPage page={params.then(({ page }) => parsePaginatedPage(page))} />
  );
}

export default BlogPaginatedPage;
