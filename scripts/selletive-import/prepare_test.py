import unittest
import csv
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from prepare import normalize_phone, normalize_state, website_domain, prepare


class ImportPreparationTests(unittest.TestCase):
    def test_incremental_run_preserves_late_service_evidence_and_skips_prior_records(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            description = 'An agency offers consulting. ' + ('Company background. ' * 40) + 'We offer Azure migrations.'
            base = {'Company Name': 'Example Agency', 'Industry': 'marketing & advertising',
                    'Short Description': description, 'Company City': 'São Paulo', 'Company State': 'SP',
                    'Company Country': 'Brazil', 'Keywords': 'agency'}
            records = [dict(base, **{'Apollo Account Id': key, 'Website': url}) for key, url in
                       [('reviewed', 'https://reviewed.example'), ('existing', 'https://existing.example'),
                        ('new', 'https://new.example')]]
            with (root / 'input.csv').open('w', newline='') as output:
                writer = csv.DictWriter(output, fieldnames=records[0].keys())
                writer.writeheader()
                writer.writerows(records)
            (root / 'reviewed.ndjson').write_text(json.dumps({'id': 'reviewed'}) + '\n')
            (root / 'businesses.json').write_text(json.dumps([{'website': 'http://www.existing.example'}]))
            prepare(root / 'input.csv', root / 'out', 10, [root / 'reviewed.ndjson'], root / 'businesses.json')
            candidates = [json.loads(line) for line in (root / 'out/candidates.ndjson').read_text().splitlines()]
            self.assertEqual([row['id'] for row in candidates], ['new'])
            self.assertEqual(candidates[0]['description'], description)
            self.assertIn('Azure migrations', candidates[0]['description'][600:])

    def test_shared_domains_and_non_http_urls_are_not_company_websites(self):
        for value in ['https://instagram.com/agency', 'https://m.facebook.com/page',
                      'ftp://agency.com', 'https://user:password@agency.com',
                      'https://agency.vercel.app', 'not a domain']:
            self.assertEqual(website_domain(value), '', value)
        self.assertEqual(website_domain('http://WWW.Agency.com.br/about'), 'agency.com.br')

    def test_apollo_state_and_spreadsheet_phone_formats(self):
        self.assertEqual(normalize_state('State of Sao Paulo'), 'SP')
        self.assertEqual(normalize_state('São Paulo'), 'SP')
        self.assertEqual(normalize_state('Not a state'), '')
        self.assertEqual(normalize_phone("'+55 11 5188-9999", 'Brazil'), '+551151889999')


if __name__ == '__main__':
    unittest.main()
