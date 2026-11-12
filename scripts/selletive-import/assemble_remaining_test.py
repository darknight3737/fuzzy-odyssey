"""Payload-level regression for incomplete locations and new category branches."""
import argparse
import csv
import json
import tempfile
import unittest
from pathlib import Path

from assemble import assemble


class AssembleRemainingTest(unittest.TestCase):
    def make_payload(self, state, conflicting_leaf=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            candidates, decisions, sources = [], [], []
            for index in range(200):
                identity = 'fixture' + str(index)
                name, domain = 'Company ' + str(index), 'fixture' + str(index) + '.com.br'
                candidates.append(dict(id=identity,name=name,domain=domain,city='',state=state))
                decisions.append(dict(id=identity,categories=['management-consulting'],
                                      description_pt=name+' oferece serviços de consultoria de gestão empresarial.',exclude=False))
                sources.append({'Apollo Account Id':identity,'Company Name':name,'Website':'https://'+domain,
                                'Company City':'','Company State':state,'Company Country':'Brazil',
                                'Company Phone':'','Logo Url':'','# Employees':'','Founded Year':''})
            (root/'candidates.ndjson').write_text(''.join(json.dumps(x)+'\n' for x in candidates))
            (root/'decisions.ndjson').write_text(''.join(json.dumps(x)+'\n' for x in decisions))
            categories=[dict(id='11111111-1111-4111-8111-111111111111',
                  name='Professional',slug='financial-professional',parent_id=None,level=1,is_active=True)]
            if conflicting_leaf:
                categories += [dict(id='22222222-2222-4222-8222-222222222222',name='Other',slug='other',
                                    parent_id=categories[0]['id'],level=2,is_active=True),
                               dict(id='33333333-3333-4333-8333-333333333333',name='Wrong branch',
                                    slug='management-consulting',parent_id='22222222-2222-4222-8222-222222222222',level=3,is_active=True)]
            (root/'categories.json').write_text(json.dumps(categories))
            (root/'locations.json').write_text('[]')
            with open(root/'input.csv','w',newline='') as f:
                writer=csv.DictWriter(f,fieldnames=list(sources[0]));writer.writeheader();writer.writerows(sources)
            assemble(argparse.Namespace(directory=str(root),input=str(root/'input.csv'),decisions=[str(root/'decisions.ndjson')]))
            return json.loads((root/'payload.json').read_text())

    def test_known_country_with_unknown_city_and_state_is_not_fabricated(self):
        payload=self.make_payload('')
        self.assertEqual(len(payload['locations']),1)
        self.assertEqual(payload['locations'][0]['type'],'country')
        self.assertEqual(len(payload['business_locations']),200)
        self.assertTrue(all(x['is_primary'] for x in payload['business_locations']))
        self.assertTrue(all(x['address']=={'country':'BR'} for x in payload['businesses']))
        self.assertEqual({x['slug'] for x in payload['categories']},{'business-consulting-services','management-consulting'})
        self.assertEqual(sum(x['is_primary'] for x in payload['business_categories']),200)

    def test_existing_leaf_in_wrong_branch_blocks_assembly(self):
        with self.assertRaisesRegex(ValueError,'Existing category conflicts'):
            self.make_payload('', conflicting_leaf=True)

    def test_known_state_is_primary_when_city_is_unknown(self):
        payload=self.make_payload('SP')
        by_id={x['id']:x for x in payload['locations']}
        self.assertEqual({x['type'] for x in by_id.values()},{'country','state'})
        primary=[x for x in payload['business_locations'] if x['is_primary']]
        self.assertEqual(len(primary),200)
        self.assertTrue(all(by_id[x['location_id']]['type']=='state' for x in primary))
        self.assertTrue(all(x['address']=={'state':'SP','country':'BR'} for x in payload['businesses']))


if __name__=='__main__':
    unittest.main()
