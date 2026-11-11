import unittest

from classify_explicit import classify


class ExplicitServiceTests(unittest.TestCase):
    allowed = {'seo-services', 'video-production', 'wordpress-development', 'azure-consulting',
               'design-services-specific', 'web-development-services-specific'}

    def decide(self, description):
        return classify({'id': 'example', 'name': 'Acme Digital', 'description': description}, self.allowed)

    def test_service_phrases_match_words_not_individual_letters(self):
        result = self.decide('Acme Digital is a marketing agency. It offers SEO services for businesses.')
        self.assertEqual(result['categories'], ['seo-services'])

    def test_full_description_keeps_late_azure_evidence(self):
        description = ('Acme Digital is an IT services company. ' + 'Company background. ' * 40
                       + 'It offers migration to Microsoft Azure for corporate clients.')
        result = self.decide(description)
        self.assertEqual(result['categories'], ['azure-consulting'])
        self.assertIn('migration to Microsoft Azure', result['evidence'][0]['quote'])

    def test_technology_use_and_negative_capabilities_do_not_become_services(self):
        result = self.decide('Acme Digital is a marketing agency. It provides SEO services and uses WordPress internally. It does not offer video production.')
        self.assertEqual(result['categories'], ['seo-services'])

    def test_product_platform_is_not_a_service_agency(self):
        result = self.decide('Acme Digital is a SaaS platform for agency customers. It provides SEO analytics.')
        self.assertTrue(result['exclude'])


if __name__ == '__main__':
    unittest.main()
