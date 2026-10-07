import {
  ChangelogListPage,
  getChangelogListMetadata,
} from './_components/changelog-list-page';

export const generateMetadata = () => getChangelogListMetadata(1);

function ChangelogPage() {
  return <ChangelogListPage page={Promise.resolve(1)} />;
}

export default ChangelogPage;
