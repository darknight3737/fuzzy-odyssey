# Continuação da importação Apollo — 4.853 empresas públicas

**Importação ainda não concluída.** Os subagentes atingiram o limite de uso da conta durante a revisão semântica. O progresso foi salvo; somente decisões concluídas e validadas foram publicadas.

Foram adicionadas **1.349 empresas** em três lotes (450 + 450 + 449), totalizando **4.853 no site**. As 3.504 anteriores e seus vínculos permaneceram integralmente iguais.

## Revisão desta rodada

- 2.067 empresas receberam revisão semântica nesta rodada.
- 1.349 foram aprovadas e importadas; 360 ficaram fora do escopo; 160 precisam de evidências adicionais; 198 precisam resolver a categoria apropriada.
- Dos 9.324 candidatos anteriores, 7.257 ainda não receberam esta revisão semântica. Outros seis sites hospedados foram recuperados pela validação de domínio e aguardam revisão.
- Total de candidatas pendentes: **7.621 = 7.263 aguardando revisão + 358 já revisadas com pendência específica**.
- 314 registros adicionais seguem sem descrição suficiente; metadados de sites oficiais foram coletados para tentar enriquecê-los. Esses registros não estão incluídos nas 7.621 candidatas.

## Contabilização de todos os registros

| Situação | Registros |
|---|---:|
| Já publicados antes desta rodada (inclui aliases) | 3510 |
| Candidatas pendentes | 7621 |
| Publicados nesta rodada | 1349 |
| Fora do escopo B2B ou não elegíveis para publicação | 449 |
| Sem descrição suficiente na origem | 314 |
| Sem site empresarial válido | 26 |
| Duplicatas no arquivo | 23 |
| Fora do Brasil | 1 |

Total: **13.293 registros de origem**. Registros não equivalem a empresas únicas, pois existem aliases e duplicatas.

## Processo econômico e verificações

- Decisões compactas em lotes, com descrições completas e evidências referenciadas por índice de sentença. O código copia as frases exatas e gera o resumo a partir das categorias comprovadas.
- Produtos e serviços separados; uma ferramenta utilizada ou o setor do cliente não comprovam oferta da empresa. Categorias específicas têm preferência sobre software empresarial genérico.
- 905 sites oficiais foram consultados para esclarecer divergências de identidade; outros 320 foram consultados para registros sem descrição ou com site hospedado anteriormente rejeitado. Metadados e erros ficaram guardados para retomada.
- Categorias B2B adicionais para software, operações e serviços financeiros foram criadas somente quando usadas. Não houve alteração de schema ou RLS.
- CI remoto aprovado: [testes, tipos, lint e formatação](https://github.com/darknight3737/fuzzy-odyssey/actions/runs/43248367513). Revisão independente das mudanças de código não encontrou bloqueios.
- Dados reconciliados por snapshot completo e paginado: todas as empresas e associações esperadas presentes, uma categoria e localização principais por empresa, nenhuma alteração nos perfis anteriores.
- Contagem de 4.853 empresas verificada no site; importador temporário encerrado com HTTP 410.
- Perfis continuam não reivindicados e pendentes de verificação. As afirmações da origem não foram confirmadas individualmente em fontes externas.

## Categorias

As contagens incluem ancestrais e não devem ser somadas entre linhas. Novas = empresas adicionadas nesta rodada.

### Áreas

| Categoria | Total | Novas |
|---|---:|---:|
| Development & Product | 1567 | 627 |
| Advertising & Marketing | 1565 | 125 |
| Financial & Professional Services | 1180 | 578 |
| IT Services | 924 | 183 |
| Creative & Visual | 215 | 12 |

### Subcategorias

| Categoria | Total | Novas |
|---|---:|---:|
| Advertising & Marketing → Marketing | 1175 | 91 |
| Development & Product → Software para empresas | 837 | 485 |
| IT Services → Gestão e integração de TI | 733 | 159 |
| Advertising & Marketing → Branding | 502 | 8 |
| Financial & Professional Services → Recursos humanos e treinamento | 435 | 191 |
| Development & Product → Software e aplicativos | 359 | 65 |
| Financial & Professional Services → Consultoria empresarial | 324 | 180 |
| Development & Product → Web Development | 270 | 26 |
| Advertising & Marketing → Advertising | 246 | 42 |
| Financial & Professional Services → Contabilidade e tributos | 203 | 45 |
| IT Services → Cyber Security | 142 | 25 |
| Financial & Professional Services → Assessoria financeira e seguros | 113 | 53 |
| Financial & Professional Services → Serviços financeiros empresariais | 99 | 99 |
| IT Services → Cloud Consulting | 99 | 21 |
| Development & Product → Dados e inteligência artificial | 96 | 86 |
| Financial & Professional Services → Operações empresariais | 92 | 92 |
| Creative & Visual → Vídeo e animação | 83 | 11 |
| Development & Product → Ecommerce | 76 | 15 |
| Creative & Visual → Design | 73 | 1 |
| Creative & Visual → User Experience (UX/UI) | 62 | 0 |
| Development & Product → Web Design | 41 | 3 |
| Financial & Professional Services → Serviços jurídicos | 36 | 33 |
| IT Services → Blockchain Development | 6 | 1 |
| Creative & Visual → Photography | 3 | 0 |

### Especialidades

| Categoria | Total | Novas |
|---|---:|---:|
| Advertising & Marketing → Marketing → Marketing Services | 542 | 77 |
| IT Services → Gestão e integração de TI → Consultoria de TI | 376 | 49 |
| Advertising & Marketing → Branding → Branding Services | 338 | 5 |
| Advertising & Marketing → Marketing → Marketing em redes sociais | 336 | 2 |
| Development & Product → Software e aplicativos → Desenvolvimento de software | 313 | 64 |
| Advertising & Marketing → Marketing → SEO | 281 | 5 |
| Advertising & Marketing → Marketing → Marketing de conteúdo | 266 | 7 |
| Development & Product → Web Development → Web Development Services | 245 | 11 |
| Financial & Professional Services → Consultoria empresarial → Consultoria de gestão | 216 | 83 |
| Financial & Professional Services → Recursos humanos e treinamento → Recrutamento e seleção | 196 | 11 |
| Development & Product → Software para empresas → Software empresarial | 154 | 109 |
| Advertising & Marketing → Marketing → Mídia paga e SEM | 151 | 4 |
| Financial & Professional Services → Recursos humanos e treinamento → Treinamento corporativo | 141 | 137 |
| Advertising & Marketing → Branding → Brand Strategy | 130 | 1 |
| Development & Product → Software para empresas → Software ERP | 128 | 9 |
| Advertising & Marketing → Advertising → Advertising Services | 123 | 35 |
| IT Services → Cyber Security → Cyber Security Services | 116 | 24 |
| Financial & Professional Services → Contabilidade e tributos → Serviços contábeis | 109 | 36 |
| IT Services → Gestão e integração de TI → Serviços gerenciados de TI | 107 | 42 |
| Development & Product → Software para empresas → Software CRM | 101 | 12 |
| Financial & Professional Services → Contabilidade e tributos → Consultoria tributária | 90 | 23 |
| IT Services → Cloud Consulting → Cloud Consulting Services | 90 | 17 |
| IT Services → Gestão e integração de TI → Terceirização de TI | 88 | 25 |
| Creative & Visual → Vídeo e animação → Produção de vídeo | 83 | 11 |
| IT Services → Gestão e integração de TI → Suporte de TI | 83 | 24 |
| IT Services → Gestão e integração de TI → Integração de sistemas | 79 | 19 |
| Financial & Professional Services → Assessoria financeira e seguros → Consultoria financeira | 78 | 35 |
| Development & Product → Dados e inteligência artificial → Serviços de análise de dados | 75 | 70 |
| Financial & Professional Services → Recursos humanos e treinamento → Consultoria de recursos humanos | 74 | 17 |
| Development & Product → Software e aplicativos → Desenvolvimento de aplicativos | 73 | 2 |
| Advertising & Marketing → Advertising → Advertising Campaign | 71 | 9 |
| Creative & Visual → Design → Design Services | 65 | 1 |
| Advertising & Marketing → Advertising → Full-Service Advertising | 62 | 0 |
| IT Services → Gestão e integração de TI → Consultoria e implantação ERP | 60 | 13 |
| Advertising & Marketing → Marketing → E-mail marketing | 56 | 0 |
| Development & Product → Software para empresas → Software de marketing | 55 | 44 |
| Development & Product → Software para empresas → Software de recursos humanos | 55 | 21 |
| Development & Product → Software para empresas → Software de comércio eletrônico | 54 | 17 |
| Advertising & Marketing → Branding → Brand Activation | 51 | 2 |
| Development & Product → Software para empresas → Software de análise de dados | 49 | 34 |
| Development & Product → Software para empresas → Software para gestão de saúde | 49 | 46 |
| Advertising & Marketing → Marketing → B2B Marketing | 46 | 2 |
| Development & Product → Software para empresas → Software de gestão empresarial | 43 | 39 |
| Development & Product → Ecommerce → eCommerce Development | 40 | 7 |
| Development & Product → Software para empresas → Software de logística | 39 | 35 |
| Development & Product → Software para empresas → Software para educação | 38 | 29 |
| Financial & Professional Services → Serviços jurídicos → Assessoria jurídica empresarial | 34 | 32 |
| Creative & Visual → User Experience (UX/UI) → UX Design | 31 | 0 |
| Development & Product → Web Design → Web Design Services | 30 | 0 |
| Financial & Professional Services → Consultoria empresarial → Consultoria de processos | 30 | 20 |
| Financial & Professional Services → Contabilidade e tributos → Gestão de folha de pagamento | 30 | 8 |
| Financial & Professional Services → Consultoria empresarial → Consultoria de estratégia empresarial | 28 | 27 |
| Financial & Professional Services → Serviços financeiros empresariais → Processamento de pagamentos empresariais | 28 | 28 |
| IT Services → Cyber Security → Penetration Testing | 28 | 0 |
| IT Services → Gestão e integração de TI → Consultoria e implantação CRM | 27 | 13 |
| Creative & Visual → User Experience (UX/UI) → User Experience (UX/UI) | 26 | 0 |
| Development & Product → Dados e inteligência artificial → Consultoria de inteligência artificial | 26 | 21 |
| Financial & Professional Services → Recursos humanos e treinamento → Saúde e bem-estar corporativo | 26 | 26 |
| Financial & Professional Services → Consultoria empresarial → Engenharia e consultoria técnica | 25 | 25 |
| Development & Product → Software para empresas → Software para varejo e ponto de venda | 24 | 24 |
| Development & Product → Ecommerce → Ecommerce Services | 21 | 8 |
| Financial & Professional Services → Assessoria financeira e seguros → Corretagem de seguros | 21 | 12 |
| Financial & Professional Services → Operações empresariais → Conexões e intermediação de negócios B2B | 21 | 21 |
| Financial & Professional Services → Serviços financeiros empresariais → Serviços bancários empresariais | 21 | 21 |
| Development & Product → Ecommerce → eCommerce Consulting | 20 | 4 |
| Financial & Professional Services → Consultoria empresarial → Consultoria ambiental e sustentabilidade | 20 | 20 |
| Financial & Professional Services → Serviços financeiros empresariais → Gestão de ativos para organizações | 20 | 20 |
| Financial & Professional Services → Serviços financeiros empresariais → Serviços para o mercado de capitais | 20 | 20 |
| Advertising & Marketing → Advertising → Advertising Production | 19 | 0 |
| Development & Product → Web Development → IoT Development | 19 | 15 |
| Financial & Professional Services → Consultoria empresarial → Desenvolvimento comercial B2B | 19 | 19 |
| Financial & Professional Services → Assessoria financeira e seguros → Assessoria de investimentos | 18 | 10 |
| Financial & Professional Services → Serviços financeiros empresariais → Crédito e financiamento empresarial | 18 | 18 |
| Development & Product → Software para empresas → Software financeiro | 17 | 17 |
| Financial & Professional Services → Operações empresariais → Gestão e comercialização de energia empresarial | 16 | 16 |
| Financial & Professional Services → Recursos humanos e treinamento → Benefícios corporativos | 16 | 16 |
| Financial & Professional Services → Operações empresariais → Produção de eventos corporativos | 15 | 15 |
| Development & Product → Software para empresas → Software para operações industriais | 13 | 13 |
| Financial & Professional Services → Operações empresariais → Logística e transporte empresarial | 13 | 13 |
| Development & Product → Software para empresas → Software contábil | 12 | 7 |
| Development & Product → Software para empresas → Software para gestão imobiliária | 12 | 12 |
| Financial & Professional Services → Serviços financeiros empresariais → Assessoria para captação de recursos | 12 | 12 |
| Advertising & Marketing → Marketing → Sports Marketing | 11 | 2 |
| Development & Product → Software para empresas → Software de automação de processos | 11 | 11 |
| Development & Product → Web Design → Web Hosting Management | 11 | 3 |
| Financial & Professional Services → Operações empresariais → Gestão de resíduos empresariais | 11 | 11 |
| Financial & Professional Services → Operações empresariais → Gestão de instalações e serviços de apoio | 10 | 10 |
| Advertising & Marketing → Advertising → Creative Advertising | 8 | 0 |
| Advertising & Marketing → Branding → Employer Branding | 8 | 0 |
| Creative & Visual → Design → Merchandising | 7 | 0 |
| Development & Product → Software para empresas → Software para gestão de documentos | 7 | 7 |
| Financial & Professional Services → Serviços jurídicos → Propriedade intelectual | 7 | 6 |
| IT Services → Cyber Security → Digital Forensics | 7 | 0 |
| Development & Product → Software para empresas → Software de atendimento ao cliente | 6 | 6 |
| Development & Product → Web Development → Wordpress Development | 6 | 0 |
| Creative & Visual → User Experience (UX/UI) → Usability Testing | 5 | 0 |
| Development & Product → Software para empresas → Software para construção | 5 | 5 |
| Development & Product → Software para empresas → Software para pagamentos | 5 | 5 |
| Advertising & Marketing → Branding → Rebranding | 4 | 0 |
| Development & Product → Web Development → Programming | 4 | 0 |
| Financial & Professional Services → Consultoria empresarial → Desenvolvimento e aceleração de negócios | 4 | 4 |
| Financial & Professional Services → Operações empresariais → Gestão de viagens corporativas | 4 | 4 |
| IT Services → Cloud Consulting → Cloud Storage | 4 | 3 |
| IT Services → Cyber Security → Data Protection | 4 | 1 |
| Creative & Visual → Design → Logo Design | 3 | 0 |
| Financial & Professional Services → Contabilidade e tributos → Escrituração contábil | 3 | 2 |
| Financial & Professional Services → Operações empresariais → Compras e suprimentos empresariais | 3 | 3 |
| IT Services → Blockchain Development → Blockchain Development | 3 | 0 |
| Advertising & Marketing → Marketing → Affiliate Marketing | 2 | 0 |
| Development & Product → Software para empresas → Software de cibersegurança | 2 | 2 |
| Development & Product → Software para empresas → Software para laboratórios | 2 | 2 |
| Financial & Professional Services → Assessoria financeira e seguros → Planejamento financeiro | 2 | 1 |
| Financial & Professional Services → Operações empresariais → Manufatura sob contrato | 2 | 2 |
| Financial & Professional Services → Operações empresariais → Tradução e localização empresarial | 2 | 2 |
| IT Services → Blockchain Development → Blockchain Consulting | 2 | 0 |
| IT Services → Blockchain Development → Smart Contract Development | 2 | 0 |
| IT Services → Blockchain Development → Web3 Development | 2 | 1 |
| IT Services → Cloud Consulting → AWS Consulting | 2 | 0 |
| IT Services → Cloud Consulting → Azure Consulting | 2 | 0 |
| IT Services → Cloud Consulting → Cloud Security | 2 | 2 |
| Advertising & Marketing → Advertising → 360° Advertising | 1 | 0 |
| Advertising & Marketing → Marketing → Blockchain Marketing | 1 | 0 |
| Creative & Visual → Design → Print Design | 1 | 0 |
| Creative & Visual → Photography → Event Photography | 1 | 0 |
| Creative & Visual → Photography → Photography Services | 1 | 0 |
| Creative & Visual → Photography → Product Photography | 1 | 0 |
| Development & Product → Dados e inteligência artificial → Desenvolvimento de inteligência artificial | 1 | 1 |
| Development & Product → Dados e inteligência artificial → Engenharia de dados | 1 | 1 |
| Development & Product → Ecommerce → E-Commerce Hosting | 1 | 0 |
| Development & Product → Web Design → Landing Page Design | 1 | 0 |
| Development & Product → Web Design → Website Revamping | 1 | 0 |
| Development & Product → Web Development → Prototype Development | 1 | 0 |
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
| IT Services → Cloud Consulting → SaaS Strategy Consulting | 0 | 0 |
| IT Services → Cyber Security → Account Takeover Prevention (ATO) | 0 | 0 |
| IT Services → Cyber Security → Auth0 IAM Solution | 0 | 0 |

## Retomada sem repetir trabalho

Arquivos privados em `scripts/selletive-import/.runs/20261112-complete/`:

- `pending-semantic-review.ndjson`: 7.257 registros anteriores ainda não revisados; preserva o grupo de trabalho.
- `needs-enrichment-category.ndjson`: 358 decisões revisadas com pendência específica e evidências.
- `pending-candidates.ndjson`: 7.621 candidatas atuais, incluindo seis sites recuperados.
- `semantic-extra-input.ndjson`: 320 registros de origem com tentativa de enriquecimento ou site recuperado; seis já estão na fila principal, portanto não devem ser duplicados.
- Snapshots, manifestos, resultados e decisões salvos com permissões privadas. Tokens temporários não foram arquivados.

**Atenção:** o arquivo original `semantic-professional.ndjson` contém candidatos de uma primeira regra automática; somente registros com `review_method=semantic-v1` foram aprovados como semanticamente revisados. Não considerar o restante como decisão concluída.

[Testar catálogo](https://selletive.frd-monteiro97.workers.dev/search)
