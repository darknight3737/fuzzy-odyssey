"""Safety cases for conservative negative scope triage."""

import unittest

from scope_b2b import out_of_scope


class OutOfScopeTest(unittest.TestCase):
    def test_excludes_clear_consumer_identity_with_exact_first_sentence(self):
        sentence = "Acme is a direct-to-consumer brand selling mattresses."
        result = out_of_scope({"name": "Acme", "description": sentence + " It sells online."})
        self.assertEqual(result, {"reason": "consumer-brand", "quote": sentence})

    def test_business_service_or_custom_software_vetoes_consumer_identity(self):
        for added in (
            " It also provides software development services for companies.",
            " Its corporate clients receive consulting services.",
        ):
            row = {"name": "Acme", "description": "Acme is a consumer brand." + added}
            self.assertIsNone(out_of_scope(row))

    def test_consumer_venue_used_as_software_clients_is_not_company_identity(self):
        row = {
            "name": "MedSoft",
            "description": "MedSoft is a software company that provides tools for a medical clinic.",
        }
        self.assertIsNone(out_of_scope(row))

    def test_consumer_term_inside_company_name_is_not_an_identity_proof(self):
        row = {
            "name": "Academia Médica",
            "description": (
                "Academia Médica is a community for healthcare professionals. "
                "It offers an educational platform for physicians."
            ),
        }
        self.assertIsNone(out_of_scope(row))

    def test_manufacturer_wholesaling_to_businesses_stays_out_of_scope(self):
        row = {
            "name": "Acme Foods",
            "description": "Acme Foods is a food manufacturer selling packaged foods to business customers.",
        }
        self.assertEqual(out_of_scope(row)["reason"], "manufacturer-of-goods")

    def test_retailer_that_is_also_a_technology_integrator_stays_pending(self):
        row = {
            "name": "WorldSpace",
            "description": (
                "WorldSpace is a Brazilian IT and technology retailer and integrator. "
                "The company focuses on providing computer hardware and business technology products. "
                "The company operates with a B2B-oriented approach, serving various segments in the technology market."
            ),
        }
        self.assertIsNone(out_of_scope(row))

    def test_contract_manufacturing_or_software_service_keeps_manufacturer_pending(self):
        descriptions = (
            "Acme Foods is a food manufacturer. It offers contract manufacturing services to brands.",
            "Acme Foods is a food manufacturer. It provides custom software to food companies.",
        )
        for description in descriptions:
            with self.subTest(description=description):
                self.assertIsNone(out_of_scope({"name": "Acme Foods", "description": description}))

    def test_never_excludes_a_b2b_provider_or_an_existing_positive(self):
        cases = [
            {"name": "Acme", "description": "Acme is a manufacturer. It provides custom software to retailers."},
            {"name": "Acme", "description": "Acme is a software platform serving companies."},
            {"name": "Acme", "description": "Acme is a consumer brand.", "categories": ["marketing-services"]},
        ]
        for row in cases:
            with self.subTest(row=row):
                self.assertIsNone(out_of_scope(row))

    def test_industry_or_unmatched_service_provider_stays_pending(self):
        rows = [
            {"name": "Acme", "industry": "retail", "description": "Acme provides specialist commercial services."},
            {"name": "Acme", "description": "Acme is a bank serving consumers and businesses."},
            {"name": "Acme", "description": "Acme is a SaaS platform for small businesses."},
        ]
        for row in rows:
            with self.subTest(row=row):
                self.assertIsNone(out_of_scope(row))


if __name__ == "__main__":
    unittest.main()
