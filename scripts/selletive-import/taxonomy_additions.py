#!/usr/bin/env python3
"""Complete service branches already contemplated by the Selletive PRD.

These are category data, not database schema. Existing categories remain intact.
"""
import argparse
import json
from pathlib import Path
from uuid import UUID, uuid5

BRANCHES = {
    'accounting-tax-services': ('Contabilidade e tributos', 'financial-professional'),
    'business-consulting-services': ('Consultoria empresarial', 'financial-professional'),
    'hr-training-services': ('Recursos humanos e treinamento', 'financial-professional'),
    'legal-services': ('Serviços jurídicos', 'financial-professional'),
    'financial-advisory-services': ('Assessoria financeira e seguros', 'financial-professional'),
    'managed-it-integration': ('Gestão e integração de TI', 'it-services'),
    'data-ai-services': ('Dados e inteligência artificial', 'development-product'),
    'business-software': ('Software para empresas', 'development-product'),
    'business-operations-services': ('Operações empresariais', 'financial-professional'),
    'business-financial-services': ('Serviços financeiros empresariais', 'financial-professional'),
}
LEAVES = {
    'financial-software': ('Software financeiro', 'business-software'),
    'payments-software': ('Software para pagamentos', 'business-software'),
    'retail-software': ('Software para varejo e ponto de venda', 'business-software'),
    'real-estate-software': ('Software para gestão imobiliária', 'business-software'),
    'laboratory-software': ('Software para laboratórios', 'business-software'),
    'industrial-software': ('Software para operações industriais', 'business-software'),
    'document-management-software': ('Software para gestão de documentos', 'business-software'),
    'construction-software': ('Software para construção', 'business-software'),
    'logistics-services': ('Logística e transporte empresarial', 'business-operations-services'),
    'corporate-travel-services': ('Gestão de viagens corporativas', 'business-operations-services'),
    'corporate-event-services': ('Produção de eventos corporativos', 'business-operations-services'),
    'waste-management-services': ('Gestão de resíduos empresariais', 'business-operations-services'),
    'facilities-management-services': ('Gestão de instalações e serviços de apoio', 'business-operations-services'),
    'procurement-services': ('Compras e suprimentos empresariais', 'business-operations-services'),
    'energy-management-services': ('Gestão e comercialização de energia empresarial', 'business-operations-services'),
    'contract-manufacturing-services': ('Manufatura sob contrato', 'business-operations-services'),
    'business-networking-services': ('Conexões e intermediação de negócios B2B', 'business-operations-services'),
    'translation-localization-services': ('Tradução e localização empresarial', 'business-operations-services'),
    'engineering-consulting-services': ('Engenharia e consultoria técnica', 'business-consulting-services'),
    'sustainability-consulting-services': ('Consultoria ambiental e sustentabilidade', 'business-consulting-services'),
    'business-development-services': ('Desenvolvimento comercial B2B', 'business-consulting-services'),
    'venture-building-services': ('Desenvolvimento e aceleração de negócios', 'business-consulting-services'),
    'corporate-health-services': ('Saúde e bem-estar corporativo', 'hr-training-services'),
    'employee-benefits-services': ('Benefícios corporativos', 'hr-training-services'),
    'business-banking-services': ('Serviços bancários empresariais', 'business-financial-services'),
    'business-lending-services': ('Crédito e financiamento empresarial', 'business-financial-services'),
    'payment-processing-services': ('Processamento de pagamentos empresariais', 'business-financial-services'),
    'capital-markets-services': ('Serviços para o mercado de capitais', 'business-financial-services'),
    'asset-management-services': ('Gestão de ativos para organizações', 'business-financial-services'),
    'fundraising-advisory-services': ('Assessoria para captação de recursos', 'business-financial-services'),
    'enterprise-software': ('Software empresarial', 'business-software'),
    'ecommerce-software': ('Software de comércio eletrônico', 'business-software'),
    'workflow-automation-software': ('Software de automação de processos', 'business-software'),
    'erp-software': ('Software ERP', 'business-software'),
    'crm-software': ('Software CRM', 'business-software'),
    'hr-software': ('Software de recursos humanos', 'business-software'),
    'accounting-software': ('Software contábil', 'business-software'),
    'marketing-software': ('Software de marketing', 'business-software'),
    'customer-service-software': ('Software de atendimento ao cliente', 'business-software'),
    'cybersecurity-software': ('Software de cibersegurança', 'business-software'),
    'analytics-software': ('Software de análise de dados', 'business-software'),
    'logistics-software': ('Software de logística', 'business-software'),
    'education-software': ('Software para educação', 'business-software'),
    'healthcare-software': ('Software para gestão de saúde', 'business-software'),
    'business-management-software': ('Software de gestão empresarial', 'business-software'),
    'accounting-services': ('Serviços contábeis', 'accounting-tax-services'),
    'bookkeeping-services': ('Escrituração contábil', 'accounting-tax-services'),
    'tax-consulting': ('Consultoria tributária', 'accounting-tax-services'),
    'payroll-services': ('Gestão de folha de pagamento', 'accounting-tax-services'),
    'management-consulting': ('Consultoria de gestão', 'business-consulting-services'),
    'business-strategy-consulting': ('Consultoria de estratégia empresarial', 'business-consulting-services'),
    'process-consulting': ('Consultoria de processos', 'business-consulting-services'),
    'recruitment-services': ('Recrutamento e seleção', 'hr-training-services'),
    'hr-consulting': ('Consultoria de recursos humanos', 'hr-training-services'),
    'training-services': ('Treinamento corporativo', 'hr-training-services'),
    'corporate-legal-services': ('Assessoria jurídica empresarial', 'legal-services'),
    'intellectual-property-services': ('Propriedade intelectual', 'legal-services'),
    'financial-consulting': ('Consultoria financeira', 'financial-advisory-services'),
    'financial-planning-services': ('Planejamento financeiro', 'financial-advisory-services'),
    'insurance-brokerage': ('Corretagem de seguros', 'financial-advisory-services'),
    'investment-advisory': ('Assessoria de investimentos', 'financial-advisory-services'),
    'it-consulting-services': ('Consultoria de TI', 'managed-it-integration'),
    'managed-it-services': ('Serviços gerenciados de TI', 'managed-it-integration'),
    'it-support-services': ('Suporte de TI', 'managed-it-integration'),
    'it-outsourcing': ('Terceirização de TI', 'managed-it-integration'),
    'systems-integration': ('Integração de sistemas', 'managed-it-integration'),
    'erp-consulting': ('Consultoria e implantação ERP', 'managed-it-integration'),
    'crm-consulting': ('Consultoria e implantação CRM', 'managed-it-integration'),
    'data-analytics-services': ('Serviços de análise de dados', 'data-ai-services'),
    'data-engineering': ('Engenharia de dados', 'data-ai-services'),
    'ai-consulting': ('Consultoria de inteligência artificial', 'data-ai-services'),
    'ai-development': ('Desenvolvimento de inteligência artificial', 'data-ai-services'),
}


def augmented_categories(existing):
    categories = {r['slug']: r for r in existing}
    for mapping, level in [(BRANCHES, 2), (LEAVES, 3)]:
        for key, (name, parent) in mapping.items():
            ancestor = categories[parent]
            if not ancestor['is_active'] or ancestor['level'] != level - 1:
                raise ValueError('Invalid category parent: ' + parent)
            if key in categories:
                current = categories[key]
                if current['level'] != level or current['parent_id'] != ancestor['id'] or not current['is_active']:
                    raise ValueError('Existing category conflict: ' + key)
            else:
                categories[key] = dict(id=str(uuid5(UUID('d2181ad8-7618-4fe3-8c55-1e08eaefc718'), 'category:' + key)),
                                       name=name, slug=key, parent_id=ancestor['id'], level=level, is_active=True)
    return list(categories.values())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--categories', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    output = Path(args.output)
    if output.exists():
        raise ValueError('Output exists; use a new snapshot path')
    output.write_text(json.dumps(augmented_categories(json.loads(Path(args.categories).read_text())), ensure_ascii=False))
