"""Focused regression cases for the pending-only B2B fallback."""

import unittest

from classify_b2b import classify


class ClassifyB2BTest(unittest.TestCase):
    def test_identity_only_service_providers_are_classified(self):
        cases = [
            ("Acme Marketing", "Acme Marketing is a marketing agency.", "marketing-services-specific"),
            ("Acme Ads", "Acme Ads is an advertising agency.", "advertising-services-specific"),
            ("Acme Accounting", "Acme Accounting is an accounting firm serving businesses.", "accounting-services"),
            ("Acme IT", "Acme IT is an IT consulting firm.", "it-consulting-services"),
            ("Acme HR", "Acme HR is an HR consultancy.", "hr-consulting"),
            ("Acme Insurance", "Acme Insurance is an insurance broker serving companies.", "insurance-brokerage"),
            ("Acme Business", "Acme Business is a business consulting firm.", "management-consulting"),
        ]
        for name, description, slug in cases:
            with self.subTest(slug=slug):
                result = classify({"id": slug, "name": name, "description": description}, {slug})
                self.assertEqual(result["categories"], [slug])
                self.assertEqual(result["evidence"][0]["quote"], description)

    def test_identity_match_and_negative_guard(self):
        mismatch = classify({"name": "Acme", "description": "Other Co is a marketing agency."}, {"marketing-services-specific"})
        negative = classify({"name": "Acme", "description": "Acme is not a marketing agency."}, {"marketing-services-specific"})
        self.assertEqual(mismatch["categories"], [])
        self.assertEqual(negative["categories"], [])

    def test_identity_phrase_for_client_does_not_classify_company_as_provider(self):
        result = classify({"name": "StudioSoft", "description": "StudioSoft is a software company that provides tools for a marketing agency."}, {"marketing-services-specific"})
        self.assertEqual(result["categories"], [])

    def test_semantic_equivalents_need_provider_and_offering_context(self):
        row = {"name": "Acme Advisory", "description": "Acme Advisory is a consulting firm. It specializes in business intelligence consulting and executive search."}
        result = classify(row, {"data-analytics-services", "recruitment-services"})
        self.assertEqual(set(result["categories"]), {"data-analytics-services", "recruitment-services"})

    def test_recruitment_software_product_is_not_recruitment_service(self):
        for row in (
            {"name": "TAQE", "description": "TAQE specializes in recruitment and selection software. Its platform connects companies with candidates."},
            {"name": "Kolab", "description": "Kolab specializes in an AI-powered recruitment and selection platform. It creates products for companies and candidates."},
        ):
            result = classify(row, {"recruitment-services", "hr-software"})
            self.assertEqual(result["categories"], ["hr-software"])

    def test_tax_and_bi_software_features_are_not_consulting_services(self):
        for phrase, slug in (("BI consulting software", "data-analytics-services"), ("tax planning software", "tax-consulting")):
            result = classify({"name": "Acme Consulting", "description": f"Acme Consulting is a consulting firm. It offers {phrase} for companies."}, {slug})
            self.assertEqual(result["categories"], [])

    def test_tax_planning_requires_explicit_offering(self):
        good = classify({"name": "Acme Tax", "description": "Acme Tax is a consulting firm. It offers tax planning to businesses."}, {"tax-consulting"})
        bad = classify({"name": "Acme Tax", "description": "Acme Tax is a consulting firm. It discusses tax planning."}, {"tax-consulting"})
        self.assertEqual(good["categories"], ["tax-consulting"])
        self.assertEqual(bad["categories"], [])

    def test_consumer_accounting_or_insurance_identity_is_not_enough(self):
        for slug, desc in (
            ("accounting-services", "Acme Accounting is an accounting firm serving individuals."),
            ("insurance-brokerage", "Acme Insurance is an insurance broker serving families."),
        ):
            result = classify({"name": "Acme Accounting" if slug == "accounting-services" else "Acme Insurance", "description": desc}, {slug})
            self.assertEqual(result["categories"], [])

    def test_ecommerce_platform_sale_is_not_development_service(self):
        result = classify({"name": "Acme Commerce", "description": "Acme Commerce is an e-commerce platform that offers its platform to retailers."}, {"ecommerce-development"})
        self.assertEqual(result["categories"], [])

    def test_owned_ecommerce_platform_uses_software_leaf(self):
        result = classify({"name": "Acme Commerce", "description": "Acme Commerce offers its virtual store platform to retailers and businesses."}, {"ecommerce-software", "ecommerce-development"})
        self.assertEqual(result["categories"], ["ecommerce-software"])

    def test_generic_owned_business_system_uses_enterprise_leaf(self):
        result = classify({"name": "Acme Systems", "description": "Acme Systems sells its own business management system to companies."}, {"enterprise-software"})
        self.assertEqual(result["categories"], ["enterprise-software"])

    def test_paid_workforce_platform_with_company_buyers_uses_generic_software_leaf(self):
        row = {
            "name": "Fieldlink.me",
            "description": (
                "FieldLink is an intelligence platform designed to enhance the management of commercial and technical field teams. "
                "It focuses on providing an agile setup and minimal workflow customization, enabling teams to access real-time data that boosts productivity, whether they are online or offline. "
                "The platform acts as a personal assistant, generating reports, forms, and workflows while facilitating collaboration between internal and external teams. "
                "Key features of FieldLink include flexible checklists that allow external teams to complete tasks via a mobile app, customizable workflows with intelligent activity suggestions, and a dynamic CRM that simplifies goal setting and report generation. "
                "The platform is adaptable to various company sizes, offering tailored plans like FieldLink Pro. "
                "With a user-friendly interface, seamless integrations, and strong data security measures, FieldLink supports hundreds of companies in streamlining their operations and improving team performance."
            ),
        }
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], ["enterprise-software"])

    def test_workforce_saas_with_explicit_company_buyers_uses_generic_leaf(self):
        row = {"name": "Acme Workforce", "description": "Acme Workforce sells its workforce SaaS to companies that need to coordinate field teams."}
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], ["enterprise-software"])

    def test_generic_platform_without_commercial_software_claim_stays_unclassified(self):
        row = {"name": "Acme Platform", "description": "Acme Platform supports companies and organizations with workflow collaboration."}
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_custom_software_services_do_not_become_enterprise_software(self):
        row = {"name": "Acme Software", "description": "Acme Software offers custom software development services for businesses."}
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_bare_software_development_service_is_not_enterprise_product(self):
        row = {"name": "Mult-Connect", "description": "Mult-Connect is a technology company. It offers services including software development for .NET applications and cloud solutions."}
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_medication_benefit_plans_and_health_platform_are_not_software_sales(self):
        row = {"name": "BSF Saúde", "description": "BSF Saúde is a health-management consultancy focused on medication benefit plans for businesses. It offers a comprehensive platform for corporate health management."}
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_internal_erp_usage_does_not_become_enterprise_software(self):
        row = {"name": "Acme ERP", "description": "Acme ERP is a consulting firm. It uses an internal ERP software tool to serve its customers."}
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_consumer_app_with_corporate_partners_is_not_enterprise_software(self):
        row = {"name": "Acme App", "description": "Acme App sells a consumer app for individuals. It supports companies that partner with the consumer app."}
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_product_and_b2b_audience_can_be_in_separate_sentences(self):
        row = {
            "name": "Acme HR",
            "description": "Acme HR offers a SaaS platform designed to digitize HR processes. The platform targets organizations seeking to manage employees.",
        }
        result = classify(row, {"hr-software"})
        self.assertEqual(result["categories"], ["hr-software"])
        self.assertEqual(result["evidence"][0]["quote"], row["description"].split(". ")[0] + ".")
        self.assertIn(row["description"].split(". ")[1], result["evidence"][0]["supporting_quotes"])

    def test_saas_marketplace_vendor_is_not_blocked_by_marketplace_word(self):
        row = {
            "name": "OmniK",
            "description": "OmniK is a retail tech company. It transforms traditional e-commerce stores into scalable multivendor marketplaces. The company offers a SaaS platform with a composable architecture. OmniK targets small and medium businesses and enterprise clients.",
        }
        result = classify(row, {"ecommerce-software", "ecommerce-development"})
        self.assertEqual(result["categories"], ["ecommerce-software"])
        self.assertTrue(any("targets small and medium businesses" in quote for quote in result["evidence"][0]["supporting_quotes"]))

    def test_explicit_marketplace_business_identity_is_held(self):
        result = classify({"name": "Acme Market", "description": "Acme Market is an online marketplace that sells consumer goods."}, {"enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_professional_end_users_alone_do_not_establish_b2b_buyer(self):
        result = classify({"name": "Schoolastic", "description": "Schoolastic is an educational platform supporting teachers with student assessments."}, {"education-software", "enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_platform_without_explicit_software_sale_stays_unclassified(self):
        row = {"name": "Yungas", "description": "Yungas specializes in a Partner Success Platform tailored for franchisors, large retail networks, and multi-unit operations. The platform integrates communications and management tools."}
        result = classify(row, {"enterprise-software"})
        self.assertEqual(result["categories"], [])

    def test_offerings_list_can_classify_it_services(self):
        row = {"name": "RTM", "description": "RTM is a Brazilian company specializing in financial-market integration and technology. Its offerings include data center services, cloud management, and cybersecurity solutions for institutions."}
        result = classify(row, {"managed-it-services", "cyber-security-services-specific"})
        self.assertEqual(set(result["categories"]), {"managed-it-services", "cyber-security-services-specific"})

    def test_generic_portuguese_name_words_do_not_verify_identity(self):
        result = classify({"name": "Agência XYZ", "description": "Agência ABC is a marketing agency."}, {"marketing-services-specific"})
        self.assertEqual(result["categories"], [])

    def test_all_distinctive_partner_tokens_must_match(self):
        result = classify({"name": "Kliemann & Arruda Advocacia", "description": "Kliemann Advocacia is a law firm offering corporate legal services."}, {"corporate-legal-services"})
        self.assertEqual(result["categories"], [])


if __name__ == "__main__":
    unittest.main()
