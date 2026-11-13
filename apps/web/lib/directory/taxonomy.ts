export type OfferingKind = 'service' | 'software';

export const softwareRoot = 'business-software';
export const genericSoftware = 'enterprise-software';

export type TaxonomyGroup = {
  slug: string;
  label: string;
  children: { slug: string; label: string }[];
};

export const softwareGroups: TaxonomyGroup[] = [
  {
    slug: 'sales-software',
    label: 'Vendas e CRM',
    children: [
      {
        slug: 'crm-software',
        label: 'CRM',
      },
      {
        slug: 'b2b-prospecting-software',
        label: 'Prospecção B2B e inteligência comercial',
      },
      {
        slug: 'sales-engagement-software',
        label: 'Automação comercial e cadências de vendas',
      },
      {
        slug: 'quote-management-software',
        label: 'Propostas e cotações',
      },
      {
        slug: 'field-sales-software',
        label: 'Força de vendas e vendas externas',
      },
      {
        slug: 'revenue-operations-software',
        label: 'Operações e análise de vendas',
      },
    ],
  },
  {
    slug: 'marketing-tools',
    label: 'Marketing',
    children: [
      {
        slug: 'marketing-software',
        label: 'Software de marketing',
      },
      {
        slug: 'marketing-automation-software',
        label: 'Automação de marketing',
      },
      {
        slug: 'email-marketing-software',
        label: 'E-mail marketing',
      },
      {
        slug: 'social-media-software',
        label: 'Gestão de redes sociais',
      },
      {
        slug: 'seo-tools-software',
        label: 'Ferramentas de SEO e visibilidade em IA',
      },
      {
        slug: 'paid-media-software',
        label: 'Gestão de campanhas e mídia paga',
      },
      {
        slug: 'conversion-software',
        label: 'Landing pages e otimização de conversão',
      },
      {
        slug: 'marketing-analytics-software',
        label: 'Análise de marketing e atribuição',
      },
      {
        slug: 'marketing-content-software',
        label: 'Conteúdo e ativos de marketing',
      },
      {
        slug: 'abm-software',
        label: 'Marketing baseado em contas (ABM)',
      },
      {
        slug: 'events-marketing-software',
        label: 'Eventos e webinars',
      },
      {
        slug: 'whatsapp-marketing-software',
        label: 'Marketing por WhatsApp',
      },
      {
        slug: 'influencer-marketing-software',
        label: 'Marketing de influência',
      },
      {
        slug: 'referral-marketing-software',
        label: 'Indicação e afiliados',
      },
      {
        slug: 'loyalty-software',
        label: 'Fidelidade e recompensas',
      },
      {
        slug: 'cdp-software',
        label: 'Plataformas de dados de clientes (CDP)',
      },
    ],
  },
  {
    slug: 'customer-experience-software',
    label: 'Atendimento e sucesso do cliente',
    children: [
      {
        slug: 'customer-service-software',
        label: 'Software de atendimento ao cliente',
      },
      {
        slug: 'help-desk-software',
        label: 'Help desk e gestão de chamados',
      },
      {
        slug: 'omnichannel-software',
        label: 'Atendimento omnichannel e WhatsApp',
      },
      {
        slug: 'customer-chatbots-software',
        label: 'Chatbots e assistentes de atendimento',
      },
      {
        slug: 'customer-success-software',
        label: 'Customer Success e gestão de carteira',
      },
      {
        slug: 'contact-center-software',
        label: 'Contact center',
      },
      {
        slug: 'customer-feedback-software',
        label: 'Pesquisas e experiência do cliente',
      },
    ],
  },
  {
    slug: 'finance-erp-software',
    label: 'ERP, finanças e contabilidade',
    children: [
      {
        slug: 'erp-software',
        label: 'ERP',
      },
      {
        slug: 'financial-software',
        label: 'Gestão financeira',
      },
      {
        slug: 'accounting-software',
        label: 'Contabilidade',
      },
      {
        slug: 'payments-software',
        label: 'Pagamentos',
      },
      {
        slug: 'tax-invoicing-software',
        label: 'Fiscal e emissão de notas',
      },
      {
        slug: 'billing-software',
        label: 'Cobrança e assinaturas',
      },
      {
        slug: 'expense-management-software',
        label: 'Despesas e reembolsos',
      },
      {
        slug: 'reconciliation-software',
        label: 'Conciliação financeira',
      },
    ],
  },
  {
    slug: 'people-software',
    label: 'RH e gestão de pessoas',
    children: [
      {
        slug: 'hr-software',
        label: 'Software de RH',
      },
      {
        slug: 'applicant-tracking-software',
        label: 'Recrutamento e seleção (ATS)',
      },
      {
        slug: 'payroll-software',
        label: 'Folha de pagamento',
      },
      {
        slug: 'time-attendance-software',
        label: 'Controle de ponto e jornada',
      },
      {
        slug: 'performance-management-software',
        label: 'Gestão de desempenho',
      },
      {
        slug: 'corporate-learning-software',
        label: 'Treinamento corporativo (LMS)',
      },
      {
        slug: 'employee-experience-software',
        label: 'Benefícios e experiência do colaborador',
      },
    ],
  },
  {
    slug: 'productivity-software',
    label: 'Projetos, produtividade e automação',
    children: [
      {
        slug: 'business-management-software',
        label: 'Gestão empresarial',
      },
      {
        slug: 'document-management-software',
        label: 'Gestão de documentos',
      },
      {
        slug: 'workflow-automation-software',
        label: 'Automação de processos',
      },
      {
        slug: 'project-management-software',
        label: 'Gestão de projetos e tarefas',
      },
      {
        slug: 'team-collaboration-software',
        label: 'Colaboração e comunicação interna',
      },
      {
        slug: 'digital-signature-software',
        label: 'Assinatura eletrônica',
      },
      {
        slug: 'contract-management-software',
        label: 'Gestão de contratos',
      },
      {
        slug: 'knowledge-management-software',
        label: 'Gestão do conhecimento',
      },
      {
        slug: 'workplace-management-software',
        label: 'Gestão de espaços e escritórios',
      },
      {
        slug: 'video-conferencing-software',
        label: 'Videoconferência',
      },
    ],
  },
  {
    slug: 'commerce-retail-software',
    label: 'Comércio eletrônico e varejo',
    children: [
      {
        slug: 'ecommerce-software',
        label: 'Plataformas de comércio eletrônico',
      },
      {
        slug: 'retail-software',
        label: 'Varejo e ponto de venda',
      },
      {
        slug: 'marketplace-integration-software',
        label: 'Integração com marketplaces',
      },
      {
        slug: 'order-management-software',
        label: 'Gestão de pedidos e estoque',
      },
      {
        slug: 'ecommerce-fraud-software',
        label: 'Antifraude para e-commerce',
      },
    ],
  },
  {
    slug: 'data-ai-software',
    label: 'Dados e inteligência artificial',
    children: [
      {
        slug: 'analytics-software',
        label: 'Análise de dados e BI',
      },
      {
        slug: 'data-integration-software',
        label: 'Integração de dados e ETL',
      },
      {
        slug: 'generative-ai-software',
        label: 'IA generativa e assistentes de trabalho',
      },
      {
        slug: 'database-software',
        label: 'Bancos de dados e armazenamento analítico',
      },
      {
        slug: 'ai-platform-software',
        label: 'Plataformas de IA e machine learning',
      },
      {
        slug: 'ai-agents-software',
        label: 'Agentes de IA e plataformas de orquestração',
      },
      {
        slug: 'data-governance-software',
        label: 'Governança e qualidade de dados',
      },
    ],
  },
  {
    slug: 'technology-software',
    label: 'TI, desenvolvimento e segurança',
    children: [
      {
        slug: 'cybersecurity-software',
        label: 'Software de cibersegurança',
      },
      {
        slug: 'it-service-desk-software',
        label: 'Service desk e gestão de TI',
      },
      {
        slug: 'observability-software',
        label: 'Monitoramento e observabilidade',
      },
      {
        slug: 'backup-software',
        label: 'Backup e recuperação',
      },
      {
        slug: 'low-code-software',
        label: 'Low-code e no-code',
      },
      {
        slug: 'devops-software',
        label: 'DevOps e testes de software',
      },
      {
        slug: 'api-integration-software',
        label: 'Integração de aplicações e gestão de APIs',
      },
      {
        slug: 'cloud-platform-software',
        label: 'Nuvem, hospedagem e infraestrutura',
      },
      {
        slug: 'identity-management-software',
        label: 'Identidade, acesso e Zero Trust',
      },
      {
        slug: 'product-management-software',
        label: 'Gestão de produto e roadmap',
      },
      {
        slug: 'iot-platform-software',
        label: 'Plataformas de IoT',
      },
    ],
  },
  {
    slug: 'logistics-industry-software',
    label: 'Logística e indústria',
    children: [
      {
        slug: 'logistics-software',
        label: 'Software de logística',
      },
      {
        slug: 'industrial-software',
        label: 'Software para operações industriais',
      },
      {
        slug: 'tms-software',
        label: 'Gestão de transportes (TMS)',
      },
      {
        slug: 'wms-software',
        label: 'Gestão de armazéns (WMS)',
      },
      {
        slug: 'manufacturing-management-software',
        label: 'Gestão de produção e manutenção',
      },
      {
        slug: 'procurement-software',
        label: 'Compras e fornecedores',
      },
      {
        slug: 'field-service-software',
        label: 'Gestão de serviços de campo',
      },
      {
        slug: 'cad-plm-software',
        label: 'Projeto técnico (CAD, BIM e PLM)',
      },
    ],
  },
  {
    slug: 'industry-software',
    label: 'Software por setor',
    children: [
      {
        slug: 'healthcare-software',
        label: 'Saúde e clínicas',
      },
      {
        slug: 'education-software',
        label: 'Educação',
      },
      {
        slug: 'real-estate-software',
        label: 'Gestão imobiliária',
      },
      {
        slug: 'construction-software',
        label: 'Construção',
      },
      {
        slug: 'laboratory-software',
        label: 'Laboratórios',
      },
      {
        slug: 'agriculture-software',
        label: 'Agronegócio',
      },
      {
        slug: 'hospitality-software',
        label: 'Hotelaria e restaurantes',
      },
      {
        slug: 'legal-practice-software',
        label: 'Escritórios jurídicos',
      },
      {
        slug: 'insurance-software',
        label: 'Seguros',
      },
    ],
  },
  {
    slug: 'design-content-software',
    label: 'Design, conteúdo e mídia',
    children: [
      {
        slug: 'design-tools-software',
        label: 'Design, prototipagem e edição visual',
      },
      {
        slug: 'media-production-software',
        label: 'Produção e edição de áudio e vídeo',
      },
      {
        slug: 'content-platform-software',
        label: 'CMS e gestão de conteúdo',
      },
      {
        slug: 'ar-vr-software',
        label: 'Realidade aumentada e virtual',
      },
      {
        slug: 'translation-software',
        label: 'Tradução e localização',
      },
    ],
  },
  {
    slug: 'risk-compliance-software',
    label: 'Governança, risco e compliance',
    children: [
      {
        slug: 'grc-software',
        label: 'Governança, risco e compliance (GRC)',
      },
      {
        slug: 'privacy-software',
        label: 'Privacidade e gestão de consentimento',
      },
      {
        slug: 'audit-software',
        label: 'Auditoria e controles',
      },
      {
        slug: 'sustainability-software',
        label: 'Sustentabilidade e gestão ambiental',
      },
    ],
  },
];

export const softwareSlugs = new Set([
  softwareRoot,
  genericSoftware,
  ...softwareGroups.flatMap((group) => [
    group.slug,
    ...group.children.map((child) => child.slug),
  ]),
]);

export const serviceGroups: TaxonomyGroup[] = [
  {
    slug: 'advertising-marketing',
    label: 'Publicidade e marketing',
    children: [
      { slug: 'advertising-services', label: 'Publicidade' },
      { slug: 'branding-services', label: 'Branding' },
      { slug: 'marketing-services', label: 'Marketing' },
    ],
  },
  {
    slug: 'creative-visual',
    label: 'Design, criação e audiovisual',
    children: [
      { slug: 'design-services', label: 'Design' },
      { slug: 'photography-services', label: 'Fotografia' },
      { slug: 'user-experience-ux-ui-services', label: 'UX/UI' },
      { slug: 'video-services', label: 'Vídeo e animação' },
    ],
  },
  {
    slug: 'development-product',
    label: 'Desenvolvimento e produto',
    children: [
      {
        slug: 'software-development-services',
        label: 'Desenvolvimento de software e aplicativos',
      },
      { slug: 'web-development-services', label: 'Desenvolvimento web' },
      { slug: 'web-design-services', label: 'Web design' },
      { slug: 'ecommerce-services', label: 'Serviços para e-commerce' },
      { slug: 'data-ai-services', label: 'Dados e inteligência artificial' },
    ],
  },
  {
    slug: 'it-services',
    label: 'Serviços de TI',
    children: [
      { slug: 'managed-it-integration', label: 'Gestão e integração de TI' },
      { slug: 'cloud-consulting-services', label: 'Consultoria em nuvem' },
      { slug: 'cyber-security-services', label: 'Cibersegurança' },
      {
        slug: 'blockchain-development-services',
        label: 'Desenvolvimento blockchain',
      },
    ],
  },
  {
    slug: 'financial-professional',
    label: 'Serviços empresariais e profissionais',
    children: [
      { slug: 'accounting-tax-services', label: 'Contabilidade e tributos' },
      {
        slug: 'business-consulting-services',
        label: 'Consultoria empresarial',
      },
      {
        slug: 'business-financial-services',
        label: 'Serviços financeiros empresariais',
      },
      { slug: 'business-operations-services', label: 'Operações empresariais' },
      {
        slug: 'financial-advisory-services',
        label: 'Assessoria financeira e seguros',
      },
      { slug: 'hr-training-services', label: 'Recursos humanos e treinamento' },
      { slug: 'legal-services', label: 'Serviços jurídicos' },
    ],
  },
];

export function taxonomyKind(slug: string): OfferingKind {
  return softwareSlugs.has(slug) ? 'software' : 'service';
}

// Snapshot from the editorial release. These links remain available in the full catalog.
const emptyAtLaunch = new Set([
  'abm-software',
  'account-takeover-prevention-ato',
  'agriculture-software',
  'ai-agents-software',
  'ai-platform-software',
  'api-integration-software',
  'applicant-tracking-software',
  'ar-vr-software',
  'audit-software',
  'auth0-iam-solution',
  'b2b-prospecting-software',
  'backup-software',
  'billing-software',
  'brochure-design',
  'cad-plm-software',
  'cdp-software',
  'cloud-platform-software',
  'contact-center-software',
  'content-platform-software',
  'contract-management-software',
  'conversion-software',
  'corporate-learning-software',
  'customer-chatbots-software',
  'customer-feedback-software',
  'customer-success-software',
  'data-governance-software',
  'data-integration-software',
  'database-software',
  'design-content-software',
  'design-tools-software',
  'devops-software',
  'digital-signature-software',
  'dropshipping',
  'ecommerce-fraud-software',
  'email-marketing-software',
  'employee-experience-software',
  'ethereum',
  'events-marketing-software',
  'expense-management-software',
  'fashion-photography',
  'field-sales-software',
  'field-service-software',
  'food-photography',
  'front-end-development',
  'generative-ai-software',
  'grc-software',
  'help-desk-software',
  'hospitality-software',
  'identity-management-software',
  'illustration',
  'initial-coin-offering-consulting',
  'insurance-software',
  'iot-platform-software',
  'it-service-desk-software',
  'knowledge-management-software',
  'legal-practice-software',
  'low-code-software',
  'loyalty-software',
  'luxury-marketing',
  'manufacturing-management-software',
  'marketing-content-software',
  'marketplace-integration-software',
  'media-production-software',
  'observability-software',
  'order-management-software',
  'paid-media-software',
  'payroll-software',
  'performance-management-software',
  'photo-editing',
  'privacy-software',
  'procurement-software',
  'product-management-software',
  'project-management-software',
  'quote-management-software',
  'reconciliation-software',
  'revenue-operations-software',
  'risk-compliance-software',
  'saas-strategy-consulting',
  'sales-engagement-software',
  'seo-tools-software',
  'shopify-development',
  'sustainability-software',
  'tax-invoicing-software',
  'team-collaboration-software',
  'time-attendance-software',
  'tms-software',
  'translation-software',
  'user-testing',
  'ux-optimization',
  'video-conferencing-software',
  'webflow-development',
  'wms-software',
  'workplace-management-software',
]);

export function showCategoryInNavigation(slug: string) {
  return slug !== genericSoftware && !emptyAtLaunch.has(slug);
}


export const softwareMenuGroups = softwareGroups
  .filter((group) => !emptyAtLaunch.has(group.slug))
  .map((group) => ({
    ...group,
    children: group.children.filter(
      (category) => !emptyAtLaunch.has(category.slug),
    ),
  }));
