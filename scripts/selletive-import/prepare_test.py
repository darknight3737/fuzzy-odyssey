import unittest

from prepare import normalize_phone, normalize_state, website_domain


class ImportPreparationTests(unittest.TestCase):
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
