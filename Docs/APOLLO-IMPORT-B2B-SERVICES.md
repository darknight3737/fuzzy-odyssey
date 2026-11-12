# Importação Apollo — fornecedores B2B

Catálogo com **3.504 empresas públicas**. Foram adicionadas **704** nesta continuação: 626 na primeira rodada e 78 na complementar. As 2.800 anteriores e seus vínculos permanecem integralmente preservados.

Escopo confirmado: fornecedores B2B de serviços e software. A triagem automática cobriu os 13.293 registros; as pendências continuam sem publicação e não foram consideradas automaticamente fora do escopo.

## Destino dos registros do CSV

| Situação | Registros |
|---|---:|
| Publicados nesta continuação | 704 |
| Pendentes de evidência ou categoria segura | 9324 |
| Já publicados antes (inclui aliases no CSV) | 2806 |
| Sem descrição | 314 |
| Fora do escopo B2B de serviços/software | 89 |
| Site inválido | 32 |
| Duplicatas no arquivo | 23 |
| Fora do Brasil | 1 |

Total: **13.293 registros**. Contagens de origem incluem aliases e duplicatas; não equivalem a empresas únicas.

## Processo e limites

- Regras determinísticas sobre descrições completas; nenhuma chamada de modelo por empresa nestas duas rodadas. Luna revisou regras e amostras.
- Categorias de produto e serviço separadas. Uma plataforma isolada não comprova software empresarial; tecnologia usada não comprova serviço ofertado.
- Identidade genérica de consultoria/desenvolvimento exige comprovação adicional quando a descrição detalha apenas produtos.
- Casos incertos e divergências de identidade permanecem na fila privada para enriquecimento ou revisão.
- Perfis públicos não reivindicados e pendentes de verificação. As afirmações do Apollo não foram confirmadas individualmente em fontes externas.
- Importação por inserção, com deduplicação de ID/domínio, manifestos e conferência paginada do banco. Nenhuma alteração de schema ou RLS.
- Testes, tipos, lint e formatação passaram no CI remoto: [rodada 626](https://github.com/darknight3737/fuzzy-odyssey/actions/runs/43231865697) e [rodada 78](https://github.com/darknight3737/fuzzy-odyssey/actions/runs/43235042837).
- Catálogo verificado visualmente com 3.504 empresas. Ambos os endpoints temporários de importação retornam HTTP 410.

## Categorias

Uma empresa pode aparecer em até três especialidades e em seus ancestrais. As contagens entre linhas não devem ser somadas. A coluna novas considera as 704 empresas desta continuação.

### Áreas

| Categoria | Total | Novas |
|---|---:|---:|
| Advertising & Marketing | 1440 | 131 |
| Development & Product | 940 | 126 |
| IT Services | 741 | 136 |
| Financial & Professional Services | 602 | 311 |
| Creative & Visual | 203 | 0 |

### Subcategorias

| Categoria | Total | Novas |
|---|---:|---:|
| Advertising & Marketing → Marketing | 1084 | 97 |
| IT Services → Gestão e integração de TI | 574 | 110 |
| Advertising & Marketing → Branding | 494 | 0 |
| Development & Product → Software para empresas | 352 | 113 |
| Development & Product → Software e aplicativos | 294 | 8 |
| Development & Product → Web Development | 244 | 0 |
| Financial & Professional Services → Recursos humanos e treinamento | 244 | 178 |
| Advertising & Marketing → Advertising | 204 | 34 |
| Financial & Professional Services → Contabilidade e tributos | 158 | 59 |
| Financial & Professional Services → Consultoria empresarial | 144 | 63 |
| IT Services → Cyber Security | 117 | 29 |
| IT Services → Cloud Consulting | 78 | 0 |
| Creative & Visual → Design | 72 | 0 |
| Creative & Visual → Vídeo e animação | 72 | 0 |
| Creative & Visual → User Experience (UX/UI) | 62 | 0 |
| Development & Product → Ecommerce | 61 | 0 |
| Financial & Professional Services → Assessoria financeira e seguros | 60 | 11 |
| Development & Product → Web Design | 38 | 0 |
| Development & Product → Dados e inteligência artificial | 10 | 5 |
| IT Services → Blockchain Development | 5 | 0 |
| Creative & Visual → Photography | 3 | 0 |
| Financial & Professional Services → Serviços jurídicos | 3 | 0 |

### Especialidades

| Categoria | Total | Novas |
|---|---:|---:|
| Advertising & Marketing → Marketing → Marketing Services | 465 | 97 |
| Advertising & Marketing → Marketing → Marketing em redes sociais | 334 | 0 |
| Advertising & Marketing → Branding → Branding Services | 333 | 0 |
| IT Services → Gestão e integração de TI → Consultoria de TI | 327 | 88 |
| Advertising & Marketing → Marketing → SEO | 276 | 0 |
| Advertising & Marketing → Marketing → Marketing de conteúdo | 259 | 0 |
| Development & Product → Software e aplicativos → Desenvolvimento de software | 249 | 8 |
| Development & Product → Web Development → Web Development Services | 234 | 0 |
| Financial & Professional Services → Recursos humanos e treinamento → Recrutamento e seleção | 185 | 168 |
| Advertising & Marketing → Marketing → Mídia paga e SEM | 147 | 0 |
| Financial & Professional Services → Consultoria empresarial → Consultoria de gestão | 133 | 63 |
| Advertising & Marketing → Branding → Brand Strategy | 129 | 0 |
| Development & Product → Software para empresas → Software ERP | 119 | 0 |
| IT Services → Cyber Security → Cyber Security Services | 92 | 29 |
| Development & Product → Software para empresas → Software CRM | 89 | 0 |
| Advertising & Marketing → Advertising → Advertising Services | 88 | 34 |
| Financial & Professional Services → Contabilidade e tributos → Serviços contábeis | 73 | 28 |
| IT Services → Cloud Consulting → Cloud Consulting Services | 73 | 0 |
| Creative & Visual → Vídeo e animação → Produção de vídeo | 72 | 0 |
| Development & Product → Software e aplicativos → Desenvolvimento de aplicativos | 71 | 0 |
| Financial & Professional Services → Contabilidade e tributos → Consultoria tributária | 67 | 31 |
| IT Services → Gestão e integração de TI → Serviços gerenciados de TI | 65 | 22 |
| Creative & Visual → Design → Design Services | 64 | 0 |
| IT Services → Gestão e integração de TI → Terceirização de TI | 63 | 0 |
| Advertising & Marketing → Advertising → Advertising Campaign | 62 | 0 |
| Advertising & Marketing → Advertising → Full-Service Advertising | 62 | 0 |
| IT Services → Gestão e integração de TI → Integração de sistemas | 60 | 0 |
| IT Services → Gestão e integração de TI → Suporte de TI | 59 | 0 |
| Financial & Professional Services → Recursos humanos e treinamento → Consultoria de recursos humanos | 57 | 8 |
| Advertising & Marketing → Marketing → E-mail marketing | 56 | 0 |
| Advertising & Marketing → Branding → Brand Activation | 49 | 0 |
| IT Services → Gestão e integração de TI → Consultoria e implantação ERP | 47 | 0 |
| Development & Product → Software para empresas → Software empresarial | 45 | 45 |
| Advertising & Marketing → Marketing → B2B Marketing | 44 | 0 |
| Financial & Professional Services → Assessoria financeira e seguros → Consultoria financeira | 43 | 6 |
| Development & Product → Software para empresas → Software de comércio eletrônico | 37 | 37 |
| Development & Product → Software para empresas → Software de recursos humanos | 34 | 31 |
| Development & Product → Ecommerce → eCommerce Development | 33 | 0 |
| Creative & Visual → User Experience (UX/UI) → UX Design | 31 | 0 |
| Development & Product → Web Design → Web Design Services | 30 | 0 |
| IT Services → Cyber Security → Penetration Testing | 28 | 0 |
| Creative & Visual → User Experience (UX/UI) → User Experience (UX/UI) | 26 | 0 |
| Financial & Professional Services → Contabilidade e tributos → Gestão de folha de pagamento | 22 | 0 |
| Advertising & Marketing → Advertising → Advertising Production | 19 | 0 |
| Development & Product → Ecommerce → eCommerce Consulting | 16 | 0 |
| Development & Product → Software para empresas → Software de análise de dados | 15 | 0 |
| IT Services → Gestão e integração de TI → Consultoria e implantação CRM | 14 | 0 |
| Development & Product → Ecommerce → Ecommerce Services | 13 | 0 |
| Development & Product → Software para empresas → Software de marketing | 11 | 0 |
| Financial & Professional Services → Consultoria empresarial → Consultoria de processos | 10 | 0 |
| Advertising & Marketing → Marketing → Sports Marketing | 9 | 0 |
| Development & Product → Software para empresas → Software para educação | 9 | 0 |
| Financial & Professional Services → Assessoria financeira e seguros → Corretagem de seguros | 9 | 5 |
| Advertising & Marketing → Advertising → Creative Advertising | 8 | 0 |
| Advertising & Marketing → Branding → Employer Branding | 8 | 0 |
| Development & Product → Web Design → Web Hosting Management | 8 | 0 |
| Financial & Professional Services → Assessoria financeira e seguros → Assessoria de investimentos | 8 | 0 |
| Creative & Visual → Design → Merchandising | 7 | 0 |
| IT Services → Cyber Security → Digital Forensics | 7 | 0 |
| Development & Product → Web Development → Wordpress Development | 6 | 0 |
| Creative & Visual → User Experience (UX/UI) → Usability Testing | 5 | 0 |
| Development & Product → Dados e inteligência artificial → Consultoria de inteligência artificial | 5 | 0 |
| Development & Product → Dados e inteligência artificial → Serviços de análise de dados | 5 | 5 |
| Development & Product → Software para empresas → Software contábil | 5 | 0 |
| Advertising & Marketing → Branding → Rebranding | 4 | 0 |
| Development & Product → Software para empresas → Software de gestão empresarial | 4 | 0 |
| Development & Product → Software para empresas → Software de logística | 4 | 0 |
| Development & Product → Web Development → IoT Development | 4 | 0 |
| Development & Product → Web Development → Programming | 4 | 0 |
| Financial & Professional Services → Recursos humanos e treinamento → Treinamento corporativo | 4 | 2 |
| Creative & Visual → Design → Logo Design | 3 | 0 |
| Development & Product → Software para empresas → Software para gestão de saúde | 3 | 0 |
| IT Services → Blockchain Development → Blockchain Development | 3 | 0 |
| IT Services → Cyber Security → Data Protection | 3 | 0 |
| Advertising & Marketing → Marketing → Affiliate Marketing | 2 | 0 |
| Financial & Professional Services → Serviços jurídicos → Assessoria jurídica empresarial | 2 | 0 |
| IT Services → Blockchain Development → Blockchain Consulting | 2 | 0 |
| IT Services → Blockchain Development → Smart Contract Development | 2 | 0 |
| IT Services → Cloud Consulting → AWS Consulting | 2 | 0 |
| IT Services → Cloud Consulting → Azure Consulting | 2 | 0 |
| Advertising & Marketing → Advertising → 360° Advertising | 1 | 0 |
| Advertising & Marketing → Marketing → Blockchain Marketing | 1 | 0 |
| Creative & Visual → Design → Print Design | 1 | 0 |
| Creative & Visual → Photography → Event Photography | 1 | 0 |
| Creative & Visual → Photography → Photography Services | 1 | 0 |
| Creative & Visual → Photography → Product Photography | 1 | 0 |
| Development & Product → Ecommerce → E-Commerce Hosting | 1 | 0 |
| Development & Product → Web Design → Landing Page Design | 1 | 0 |
| Development & Product → Web Design → Website Revamping | 1 | 0 |
| Development & Product → Web Development → Prototype Development | 1 | 0 |
| Financial & Professional Services → Assessoria financeira e seguros → Planejamento financeiro | 1 | 0 |
| Financial & Professional Services → Consultoria empresarial → Consultoria de estratégia empresarial | 1 | 0 |
| Financial & Professional Services → Contabilidade e tributos → Escrituração contábil | 1 | 0 |
| Financial & Professional Services → Serviços jurídicos → Propriedade intelectual | 1 | 0 |
| IT Services → Blockchain Development → Web3 Development | 1 | 0 |
| IT Services → Cloud Consulting → Cloud Storage | 1 | 0 |
| Advertising & Marketing → Marketing → Luxury Marketing | 0 | 0 |
| Creative & Visual → Design → Brochure Design | 0 | 0 |
| Creative & Visual → Design → Illustration | 0 | 0 |
| Creative & Visual → Photography → Fashion Photography | 0 | 0 |
| Creative & Visual → Photography → Food Photography | 0 | 0 |
| Creative & Visual → Photography → Photo Editing | 0 | 0 |
| Creative & Visual → User Experience (UX/UI) → Interface Testing | 0 | 0 |
| Creative & Visual → User Experience (UX/UI) → UX optimization | 0 | 0 |
| Creative & Visual → User Experience (UX/UI) → User Testing | 0 | 0 |
| Development & Product → Ecommerce → Dropshipping | 0 | 0 |
| Development & Product → Ecommerce → Shopify Development | 0 | 0 |
| Development & Product → Web Design → Front End Development | 0 | 0 |
| Development & Product → Web Development → Webflow Development | 0 | 0 |
| IT Services → Blockchain Development → Ethereum | 0 | 0 |
| IT Services → Blockchain Development → Initial Coin Offering Consulting | 0 | 0 |
| IT Services → Cloud Consulting → Cloud Security | 0 | 0 |
| IT Services → Cloud Consulting → SaaS Strategy Consulting | 0 | 0 |
| IT Services → Cyber Security → Account Takeover Prevention (ATO) | 0 | 0 |
| IT Services → Cyber Security → Auth0 IAM Solution | 0 | 0 |

## Arquivos de auditoria

Decisões com evidências, fonte, manifestos, snapshots, resultados e pendências ficam fora do Git em `scripts/selletive-import/.runs/20261112-b2b/` e `scripts/selletive-import/.runs/20261112-b2b-services/`, com permissões privadas. Tokens temporários não foram arquivados.

[Testar catálogo](https://selletive.frd-monteiro97.workers.dev/search)
