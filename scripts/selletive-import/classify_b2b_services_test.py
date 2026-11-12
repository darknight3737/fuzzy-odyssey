"""Regression checks for B2B service-only classification."""

import unittest

from classify_b2b_services import classify


class ClassifyB2BServicesTest(unittest.TestCase):
    def test_identity_and_explicit_it_consulting_offer_are_required(self):
        allowed = {"it-consulting-services"}
        good = classify({
            "id": "it", "name": "Acme IT",
            "description": "Acme IT is an IT consulting company. It offers IT consulting to business clients.",
        }, allowed)
        mismatch = classify({
            "id": "mismatch", "name": "Acme IT",
            "description": "Other IT is an IT consulting company. It offers IT consulting to business clients.",
        }, allowed)
        self.assertEqual(good["categories"], ["it-consulting-services"])
        self.assertEqual(mismatch["categories"], [])

    def test_software_vendor_and_client_technology_are_not_services(self):
        result = classify({
            "id": "vendor", "name": "Acme Cloud",
            "description": "Acme Cloud is a SaaS company. Its platform uses AWS and Azure for business customers.",
        }, {"it-consulting-services", "cloud-consulting-services-specific"})
        self.assertEqual(result["categories"], [])

    def test_service_provider_identity_maps_only_to_an_active_leaf(self):
        row = {
            "id": "dev", "name": "Acme Dev",
            "description": "Acme Dev is a software development company serving business clients.",
        }
        self.assertEqual(classify(row, {"software-development"})["categories"], ["software-development"])
        self.assertEqual(classify(row, {"enterprise-software"})["categories"], [])

    def test_provider_role_mentioned_as_customer_does_not_match_identity(self):
        row = {
            "id": "client", "name": "StudioSoft",
            "description": "StudioSoft is a software company that provides tools for a marketing agency.",
        }
        self.assertEqual(classify(row, {"marketing-services-specific"})["categories"], [])

    def test_consulting_firm_needs_business_consulting_identity(self):
        row = {"id": "firm", "name": "Acme Advisory", "description": "Acme Advisory is a consulting firm. It offers tax planning software to companies."}
        self.assertEqual(classify(row, {"management-consulting"})["categories"], [])

    def test_negated_direct_identity_does_not_approve(self):
        row = {"id": "negative", "name": "Acme", "description": "Acme is not a software development company."}
        self.assertEqual(classify(row, {"software-development"})["categories"], [])

    def test_finance_and_design_direct_identity_require_business_buyers(self):
        finance = {"id": "finance", "name": "Acme Finance", "description": "Acme Finance is a financial advisory firm."}
        design = {"id": "design", "name": "Acme Design", "description": "Acme Design is a design studio specializing in interior design."}
        self.assertEqual(classify(finance, {"financial-consulting"})["categories"], [])
        self.assertEqual(classify(design, {"design-services-specific"})["categories"], [])

    def test_training_software_is_neither_training_service_nor_b2b(self):
        row = {"id": "training-app", "name": "Acme Training", "description": "Acme Training is a training provider. It offers training software and leadership programs."}
        self.assertEqual(classify(row, {"training-services"})["categories"], [])


if __name__ == "__main__":
    unittest.main()
