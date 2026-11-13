-- Editorial catalog update. Existing category IDs, slugs and business links are preserved.
begin;

update public.categories
set parent_id = null, level = 1, name = 'Software para empresas'
where slug = 'business-software';

insert into public.categories (slug, name, level, parent_id)
select item.slug, item.name, 2, root.id
from (values
  ('sales-software', 'Vendas e CRM'),
  ('marketing-tools', 'Marketing'),
  ('customer-experience-software', 'Atendimento e sucesso do cliente'),
  ('finance-erp-software', 'ERP, finanças e contabilidade'),
  ('people-software', 'RH e gestão de pessoas'),
  ('productivity-software', 'Projetos, produtividade e automação'),
  ('commerce-retail-software', 'Comércio eletrônico e varejo'),
  ('data-ai-software', 'Dados e inteligência artificial'),
  ('technology-software', 'TI, desenvolvimento e segurança'),
  ('logistics-industry-software', 'Logística e indústria'),
  ('industry-software', 'Software por setor'),
  ('design-content-software', 'Design, conteúdo e mídia'),
  ('risk-compliance-software', 'Governança, risco e compliance')
) as item(slug, name)
join public.categories root on root.slug = 'business-software'
on conflict (slug) do update
set name = excluded.name, level = excluded.level, parent_id = excluded.parent_id;

insert into public.categories (slug, name, level, parent_id)
select item.slug, item.name, 3, parent.id
from (values
  ('crm-software', 'CRM', 'sales-software'),
  ('b2b-prospecting-software', 'Prospecção B2B e inteligência comercial', 'sales-software'),
  ('sales-engagement-software', 'Automação comercial e cadências de vendas', 'sales-software'),
  ('quote-management-software', 'Propostas e cotações', 'sales-software'),
  ('field-sales-software', 'Força de vendas e vendas externas', 'sales-software'),
  ('revenue-operations-software', 'Operações e análise de vendas', 'sales-software'),
  ('marketing-software', 'Software de marketing', 'marketing-tools'),
  ('marketing-automation-software', 'Automação de marketing', 'marketing-tools'),
  ('email-marketing-software', 'E-mail marketing', 'marketing-tools'),
  ('social-media-software', 'Gestão de redes sociais', 'marketing-tools'),
  ('seo-tools-software', 'Ferramentas de SEO e visibilidade em IA', 'marketing-tools'),
  ('paid-media-software', 'Gestão de campanhas e mídia paga', 'marketing-tools'),
  ('conversion-software', 'Landing pages e otimização de conversão', 'marketing-tools'),
  ('marketing-analytics-software', 'Análise de marketing e atribuição', 'marketing-tools'),
  ('marketing-content-software', 'Conteúdo e ativos de marketing', 'marketing-tools'),
  ('abm-software', 'Marketing baseado em contas (ABM)', 'marketing-tools'),
  ('events-marketing-software', 'Eventos e webinars', 'marketing-tools'),
  ('whatsapp-marketing-software', 'Marketing por WhatsApp', 'marketing-tools'),
  ('influencer-marketing-software', 'Marketing de influência', 'marketing-tools'),
  ('referral-marketing-software', 'Indicação e afiliados', 'marketing-tools'),
  ('loyalty-software', 'Fidelidade e recompensas', 'marketing-tools'),
  ('cdp-software', 'Plataformas de dados de clientes (CDP)', 'marketing-tools'),
  ('customer-service-software', 'Software de atendimento ao cliente', 'customer-experience-software'),
  ('help-desk-software', 'Help desk e gestão de chamados', 'customer-experience-software'),
  ('omnichannel-software', 'Atendimento omnichannel e WhatsApp', 'customer-experience-software'),
  ('customer-chatbots-software', 'Chatbots e assistentes de atendimento', 'customer-experience-software'),
  ('customer-success-software', 'Customer Success e gestão de carteira', 'customer-experience-software'),
  ('contact-center-software', 'Contact center', 'customer-experience-software'),
  ('customer-feedback-software', 'Pesquisas e experiência do cliente', 'customer-experience-software'),
  ('erp-software', 'ERP', 'finance-erp-software'),
  ('financial-software', 'Gestão financeira', 'finance-erp-software'),
  ('accounting-software', 'Contabilidade', 'finance-erp-software'),
  ('payments-software', 'Pagamentos', 'finance-erp-software'),
  ('tax-invoicing-software', 'Fiscal e emissão de notas', 'finance-erp-software'),
  ('billing-software', 'Cobrança e assinaturas', 'finance-erp-software'),
  ('expense-management-software', 'Despesas e reembolsos', 'finance-erp-software'),
  ('reconciliation-software', 'Conciliação financeira', 'finance-erp-software'),
  ('hr-software', 'Software de RH', 'people-software'),
  ('applicant-tracking-software', 'Recrutamento e seleção (ATS)', 'people-software'),
  ('payroll-software', 'Folha de pagamento', 'people-software'),
  ('time-attendance-software', 'Controle de ponto e jornada', 'people-software'),
  ('performance-management-software', 'Gestão de desempenho', 'people-software'),
  ('corporate-learning-software', 'Treinamento corporativo (LMS)', 'people-software'),
  ('employee-experience-software', 'Benefícios e experiência do colaborador', 'people-software'),
  ('business-management-software', 'Gestão empresarial', 'productivity-software'),
  ('document-management-software', 'Gestão de documentos', 'productivity-software'),
  ('workflow-automation-software', 'Automação de processos', 'productivity-software'),
  ('project-management-software', 'Gestão de projetos e tarefas', 'productivity-software'),
  ('team-collaboration-software', 'Colaboração e comunicação interna', 'productivity-software'),
  ('digital-signature-software', 'Assinatura eletrônica', 'productivity-software'),
  ('contract-management-software', 'Gestão de contratos', 'productivity-software'),
  ('knowledge-management-software', 'Gestão do conhecimento', 'productivity-software'),
  ('workplace-management-software', 'Gestão de espaços e escritórios', 'productivity-software'),
  ('video-conferencing-software', 'Videoconferência', 'productivity-software'),
  ('ecommerce-software', 'Plataformas de comércio eletrônico', 'commerce-retail-software'),
  ('retail-software', 'Varejo e ponto de venda', 'commerce-retail-software'),
  ('marketplace-integration-software', 'Integração com marketplaces', 'commerce-retail-software'),
  ('order-management-software', 'Gestão de pedidos e estoque', 'commerce-retail-software'),
  ('ecommerce-fraud-software', 'Antifraude para e-commerce', 'commerce-retail-software'),
  ('analytics-software', 'Análise de dados e BI', 'data-ai-software'),
  ('data-integration-software', 'Integração de dados e ETL', 'data-ai-software'),
  ('generative-ai-software', 'IA generativa e assistentes de trabalho', 'data-ai-software'),
  ('database-software', 'Bancos de dados e armazenamento analítico', 'data-ai-software'),
  ('ai-platform-software', 'Plataformas de IA e machine learning', 'data-ai-software'),
  ('ai-agents-software', 'Agentes de IA e plataformas de orquestração', 'data-ai-software'),
  ('data-governance-software', 'Governança e qualidade de dados', 'data-ai-software'),
  ('cybersecurity-software', 'Software de cibersegurança', 'technology-software'),
  ('it-service-desk-software', 'Service desk e gestão de TI', 'technology-software'),
  ('observability-software', 'Monitoramento e observabilidade', 'technology-software'),
  ('backup-software', 'Backup e recuperação', 'technology-software'),
  ('low-code-software', 'Low-code e no-code', 'technology-software'),
  ('devops-software', 'DevOps e testes de software', 'technology-software'),
  ('api-integration-software', 'Integração de aplicações e gestão de APIs', 'technology-software'),
  ('cloud-platform-software', 'Nuvem, hospedagem e infraestrutura', 'technology-software'),
  ('identity-management-software', 'Identidade, acesso e Zero Trust', 'technology-software'),
  ('product-management-software', 'Gestão de produto e roadmap', 'technology-software'),
  ('iot-platform-software', 'Plataformas de IoT', 'technology-software'),
  ('logistics-software', 'Software de logística', 'logistics-industry-software'),
  ('industrial-software', 'Software para operações industriais', 'logistics-industry-software'),
  ('tms-software', 'Gestão de transportes (TMS)', 'logistics-industry-software'),
  ('wms-software', 'Gestão de armazéns (WMS)', 'logistics-industry-software'),
  ('manufacturing-management-software', 'Gestão de produção e manutenção', 'logistics-industry-software'),
  ('procurement-software', 'Compras e fornecedores', 'logistics-industry-software'),
  ('field-service-software', 'Gestão de serviços de campo', 'logistics-industry-software'),
  ('cad-plm-software', 'Projeto técnico (CAD, BIM e PLM)', 'logistics-industry-software'),
  ('healthcare-software', 'Saúde e clínicas', 'industry-software'),
  ('education-software', 'Educação', 'industry-software'),
  ('real-estate-software', 'Gestão imobiliária', 'industry-software'),
  ('construction-software', 'Construção', 'industry-software'),
  ('laboratory-software', 'Laboratórios', 'industry-software'),
  ('agriculture-software', 'Agronegócio', 'industry-software'),
  ('hospitality-software', 'Hotelaria e restaurantes', 'industry-software'),
  ('legal-practice-software', 'Escritórios jurídicos', 'industry-software'),
  ('insurance-software', 'Seguros', 'industry-software'),
  ('design-tools-software', 'Design, prototipagem e edição visual', 'design-content-software'),
  ('media-production-software', 'Produção e edição de áudio e vídeo', 'design-content-software'),
  ('content-platform-software', 'CMS e gestão de conteúdo', 'design-content-software'),
  ('ar-vr-software', 'Realidade aumentada e virtual', 'design-content-software'),
  ('translation-software', 'Tradução e localização', 'design-content-software'),
  ('grc-software', 'Governança, risco e compliance (GRC)', 'risk-compliance-software'),
  ('privacy-software', 'Privacidade e gestão de consentimento', 'risk-compliance-software'),
  ('audit-software', 'Auditoria e controles', 'risk-compliance-software'),
  ('sustainability-software', 'Sustentabilidade e gestão ambiental', 'risk-compliance-software')
) as item(slug, name, parent_slug)
join public.categories parent on parent.slug = item.parent_slug
on conflict (slug) do update
set name = excluded.name, level = excluded.level, parent_id = excluded.parent_id;

update public.categories c
set parent_id = p.id, level = 2
from public.categories p
where c.slug = 'enterprise-software' and p.slug = 'business-software';

update public.categories c
set parent_id = p.id, name = v.name
from (values
  ('front-end-development', 'web-development-services', 'Desenvolvimento front-end'),
  ('web-hosting-management', 'cloud-consulting-services', 'Hospedagem e gestão web'),
  ('blockchain-development', 'blockchain-development-services', 'Desenvolvimento blockchain geral')
) as v(slug, parent_slug, name)
join public.categories p on p.slug = v.parent_slug
where c.slug = v.slug;

-- Verified against the vendors' product pages and restricted to existing software.
insert into public.business_categories (business_id, category_id)
select b.id, c.id
from (values
  ('enviou-014a70c8', 'marketing-automation-software'),
  ('netdeal-018840af', 'marketing-automation-software'),
  ('mlabs-0188410b', 'social-media-software'),
  ('reportei-01884ea5', 'marketing-analytics-software'),
  ('hablla-010fd224', 'marketing-automation-software'),
  ('hablla-010fd224', 'whatsapp-marketing-software'),
  ('hablla-010fd224', 'omnichannel-software'),
  ('squid-0147c136', 'influencer-marketing-software'),
  ('beeviral-member-get-member-platform-0188512e', 'referral-marketing-software')
) as item(business_slug, category_slug)
join public.businesses b on b.slug = item.business_slug and b.offering_kind = 'software'
join public.categories c on c.slug = item.category_slug
on conflict (business_id, category_id) do nothing;

commit;
