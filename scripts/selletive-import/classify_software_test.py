"""Regression cases for high-precision business software classification."""

import unittest

from classify_software import classify


ALLOWED = {
    "erp-software", "crm-software", "hr-software", "accounting-software",
    "marketing-software", "customer-service-software", "cybersecurity-software",
    "analytics-software", "logistics-software", "education-software",
    "healthcare-software", "business-management-software",
}


class ClassifySoftwareTest(unittest.TestCase):
    def test_company_explicitly_sells_its_own_erp(self):
        description = (
            "Acme Systems is a software company. Acme Systems offers its own ERP software "
            "for manufacturing and distribution businesses."
        )
        result = classify({"id": "1", "name": "Acme Systems", "description": description}, ALLOWED)
        self.assertEqual(result["categories"], ["erp-software"])
        self.assertEqual(result["evidence"][0]["quote"], description.split(". ")[1])
        self.assertFalse(result["exclude"])

    def test_product_description_can_support_multiple_specific_leaves(self):
        result = classify({
            "id": "2", "name": "Dommus Tecnologia",
            "description": (
                "Dommus Tecnologia is a Brazilian software company. It specializes in providing "
                "a real estate CRM and commercial ERP tailored for property developers."
            ),
        }, ALLOWED)
        self.assertEqual(result["categories"], ["erp-software", "crm-software"])
        self.assertTrue(all(item["quote"].startswith("It specializes") for item in result["evidence"]))

    def test_software_development_and_implementation_services_are_not_products(self):
        result = classify({
            "id": "3", "name": "Acme Software",
            "description": (
                "Acme Software is a software development company. It offers custom ERP "
                "software development and implementation services for clients."
            ),
        }, ALLOWED)
        self.assertEqual(result["categories"], [])
        self.assertTrue(result["exclude"])

    def test_technology_use_is_not_product_evidence(self):
        result = classify({
            "id": "4", "name": "Acme Analytics",
            "description": "Acme Analytics is a consulting firm. It uses analytics software and ERP systems for clients.",
        }, ALLOWED)
        self.assertEqual(result["categories"], [])

    def test_crm_mentioned_in_a_service_list_is_not_crm_software(self):
        result = classify({
            "id": "4b", "name": "Gstão Marketing e Vendas",
            "description": (
                "Gstão Marketing e Vendas is a marketing agency. It offers a range of services, "
                "including full sales operation management, CRM and automation, and email marketing."
            ),
        }, ALLOWED)
        self.assertEqual(result["categories"], [])

    def test_company_identity_must_match_the_description(self):
        result = classify({
            "id": "5", "name": "Acme Systems",
            "description": "Different Systems is a software company that offers ERP software to clients.",
        }, ALLOWED)
        self.assertEqual(result["categories"], [])
        self.assertEqual(result["reason"], "abstained: company identity mismatch")

    def test_financial_and_retail_businesses_are_not_software_vendors(self):
        for name, description in (
            ("Acme Bank", "Acme Bank is a digital bank. It offers accounting software to customers."),
            ("Acme Market", "Acme Market is an online marketplace. It offers logistics software to sellers."),
            ("Acme Retail", "Acme Retail is a retailer. It sells its own CRM software to small businesses."),
            ("Acme Lending", "Acme Lending is a fintech lender. It offers a business management platform."),
        ):
            with self.subTest(name=name):
                result = classify({"id": name, "name": name, "description": description}, ALLOWED)
                self.assertEqual(result["categories"], [])
                self.assertEqual(result["reason"], "abstained: excluded business identity")

    def test_inactive_taxonomy_leaf_is_ignored(self):
        result = classify({
            "id": "6", "name": "Acme Systems",
            "description": "Acme Systems sells its own ERP software to companies.",
        }, {"crm-software"})
        self.assertEqual(result["categories"], [])
        self.assertTrue(result["exclude"])

    def test_decisions_are_bounded_and_quote_exact_source_text(self):
        sentence = "Acme Systems offers its own ERP and CRM software for growing businesses."
        result = classify({
            "id": "7", "name": "Acme Systems",
            "description": "Acme Systems is a software company. " + sentence,
        }, ALLOWED)
        self.assertEqual(len(result["categories"]), len(result["evidence"]))
        self.assertLessEqual(len(result["categories"]), 3)
        self.assertTrue(all(item["quote"] == sentence for item in result["evidence"]))
        self.assertGreaterEqual(len(result["description_pt"]), 40)
        self.assertLessEqual(len(result["description_pt"]), 650)

    def test_client_software_does_not_establish_product_ownership(self):
        result=classify(dict(id='helper',name='Acme',description='Acme helps clients manage their CRM software.'), ALLOWED)
        self.assertEqual(result['categories'], [])

    def test_flagship_product_is_explicit_ownership(self):
        result=classify(dict(id='vendor',name='Acme',description='Acme is a software company. Its flagship product is ERP software for companies.'), ALLOWED)
        self.assertEqual(result['categories'], ['erp-software'])

    def test_internal_erp_usage_is_not_a_software_product(self):
        result=classify(dict(id='internal',name='Acme',description='Acme uses its ERP software to manage inventory.'), ALLOWED)
        self.assertEqual(result['categories'], [])

    def test_expertise_in_third_party_erp_tools_is_not_a_product(self):
        result=classify(dict(id='advisor',name='Compila',description='Compila is a technology company. The company offers expertise in Totvs ERP tools, including Protheus and Fluig, to enhance business operations.'), ALLOWED)
        self.assertEqual(result['categories'], [])


if __name__ == "__main__":
    unittest.main()
