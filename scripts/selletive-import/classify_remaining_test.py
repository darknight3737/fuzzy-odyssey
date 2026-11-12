"""Regression cases for conservative classification of import descriptions."""

import unittest

from classify_remaining import classify


ALLOWED = {
    "marketing-services-specific", "branding-services-specific", "brand-strategy", "web-development-services-specific",
    "cloud-consulting-services-specific", "video-production", "software-development", "erp-consulting",
    "accounting-services", "financial-consulting",
}


class ClassifyRemainingTest(unittest.TestCase):
    def test_explicit_marketing_agency_service_is_classified_with_quote(self):
        row = {
            "id": "1", "name": "Acme Creative",
            "description": "Acme Creative is a marketing agency. It offers marketing services and brand strategy for clients.",
        }
        result = classify(row, ALLOWED)
        self.assertEqual(result["categories"], ["marketing-services-specific", "brand-strategy"])
        self.assertTrue(result["evidence"])
        self.assertIn("marketing services", result["evidence"][0]["quote"])

    def test_portuguese_offered_web_development_is_classified(self):
        result = classify({
            "id": "2", "name": "Oficina Digital",
            "description": "Oficina Digital é um estúdio de desenvolvimento. Oferece desenvolvimento de websites para empresas.",
        }, ALLOWED)
        self.assertEqual(result["categories"], ["web-development-services-specific"])

    def test_product_vendor_is_excluded_even_when_identity_matches(self):
        result = classify({
            "id": "3", "name": "Acme Cloud",
            "description": "Acme Cloud is a SaaS company. It offers cloud consulting to customers.",
        }, ALLOWED)
        self.assertEqual(result["categories"], [])
        self.assertEqual(result["reason"], "abstained: product vendor")

    def test_identity_mismatch_blocks_service_phrase(self):
        result = classify({
            "id": "4", "name": "Acme Creative",
            "description": "Different Brand is a marketing agency that offers marketing services.",
        }, ALLOWED)
        self.assertEqual(result["categories"], [])
        self.assertEqual(result["reason"], "abstained: company identity mismatch")

    def test_technology_or_keywords_are_not_classification_evidence(self):
        result = classify({
            "id": "5", "name": "Acme Software",
            "description": "Acme Software is a software company using AWS, Azure, and WordPress.",
            "keywords": "cloud consulting, web development",
        }, ALLOWED)
        self.assertEqual(result["categories"], [])

    def test_service_without_taxonomy_leaf_stays_unclassified(self):
        result = classify({
            "id": "6", "name": "Acme Advisory",
            "description": "Acme Advisory is a consulting firm. It offers financial planning services to businesses.",
        }, ALLOWED)
        self.assertEqual(result["categories"], [])
        self.assertEqual(result["reason"], "abstained: no matching taxonomy leaf")

    def test_erp_consulting_company_does_not_need_agency_wording(self):
        result = classify({
            "id": "8", "name": "Acme ERP Consulting",
            "description": "Acme ERP Consulting is a consulting and services firm. It provides ERP consulting and implementation for clients.",
        }, ALLOWED)
        self.assertEqual(result["categories"], ["erp-consulting"])

    def test_accounting_service_is_not_inferred_from_bank_or_fintech_product(self):
        result = classify({
            "id": "9", "name": "Acme Fintech",
            "description": "Acme Fintech is a digital bank and SaaS company. It offers accounting software for small businesses.",
        }, ALLOWED)
        self.assertEqual(result["categories"], [])
        self.assertEqual(result["reason"], "abstained: product vendor")

    def test_accounting_firm_requires_explicit_accounting_service(self):
        result = classify({
            "id": "10", "name": "Acme Accounting",
            "description": "Acme Accounting is an accounting firm. It offers accounting services to small businesses.",
        }, ALLOWED)
        self.assertEqual(result["categories"], ["accounting-services"])

    def test_evidence_and_category_count_remain_bounded(self):
        result = classify({
            "id": "7", "name": "Acme Studio",
            "description": "Acme Studio is a creative studio. It offers marketing services, branding services, and video production for clients.",
        }, ALLOWED)
        self.assertLessEqual(len(result["categories"]), 3)
        self.assertEqual(len(result["categories"]), len(result["evidence"]))
        self.assertTrue(all(entry["quote"] for entry in result["evidence"]))

    def test_client_ecommerce_sector_does_not_become_offered_service(self):
        for sentence in [
            "VIWSEC is a cybersecurity firm specializing in protecting environments for e-commerce services.",
            "VIWSEC offers cybersecurity protection for corporate and e-commerce services.",
        ]:
            with self.subTest(sentence=sentence):
                result=classify(dict(id='viwsec',name='VIWSEC',description=sentence), {'ecommerce-services-specific'})
                self.assertEqual(result['categories'], [])

    def test_direct_ecommerce_service_remains_classifiable(self):
        result=classify(dict(id='agency',name='Acme Agency',description='Acme Agency offers comprehensive e-commerce services to clients.'), {'ecommerce-services-specific'})
        self.assertEqual(result['categories'], ['ecommerce-services-specific'])

    def test_partial_partner_firm_identity_is_held(self):
        result=classify(dict(id='firm',name='Kliemann & Arruda Advocacia',description='Kliemann Advocacia is a law firm that offers corporate legal services.'), {'corporate-legal-services'})
        self.assertTrue(result['exclude'])


if __name__ == "__main__":
    unittest.main()
