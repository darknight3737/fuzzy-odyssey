import {
  BlogListPage,
  getBlogListMetadata,
} from './_components/blog-list-page';

export const generateMetadata = () => getBlogListMetadata(1);

function BlogPage() {
  return <BlogListPage page={Promise.resolve(1)} />;
}

export default BlogPage;
