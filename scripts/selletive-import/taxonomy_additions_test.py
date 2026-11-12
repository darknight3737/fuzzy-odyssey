"""Guard the shared prospective taxonomy before insertion into the live catalog."""
import unittest
from taxonomy_additions import augmented_categories


class TaxonomyAdditionsTest(unittest.TestCase):
    def roots(self):
        return [dict(id=slug,slug=slug,name=slug,parent_id=None,level=1,is_active=True)
                for slug in ['financial-professional','it-services','development-product']]

    def test_ids_and_parent_hierarchy_remain_stable_on_rerun(self):
        first=augmented_categories(self.roots())
        second=augmented_categories(first)
        self.assertEqual(first,second)
        by_id={x['id']:x for x in first}
        for row in first:
            if row['parent_id']:
                self.assertEqual(by_id[row['parent_id']]['level'],row['level']-1)
        self.assertEqual(len(by_id),len(first))

    def test_existing_slug_with_different_parent_blocks_import(self):
        rows=self.roots()+[dict(id='conflict',slug='erp-software',name='Existing',parent_id='other',level=3,is_active=True)]
        with self.assertRaisesRegex(ValueError,'Existing category conflict'):
            augmented_categories(rows)

    def test_inactive_parent_blocks_new_branch(self):
        rows=self.roots();rows[0]['is_active']=False
        with self.assertRaisesRegex(ValueError,'Invalid category parent'):
            augmented_categories(rows)


if __name__=='__main__':
    unittest.main()
