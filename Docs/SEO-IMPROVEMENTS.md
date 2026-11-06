# Selletive — navegação, indexação e imagens sociais

Escopo aprovado em 06/11/2026: somente os ajustes de SEO técnico e compartilhamento do item 6 da análise Dirstarter. Analytics, planos, conteúdo gratuito/pago e novos fluxos comerciais continuam sem alteração.

## Implementação

- Especialidades ativas dos perfis levam à categoria. Localidades levam à combinação com a especialidade principal ativa; sem especialidade ativa, permanecem texto.
- Categorias vazias ficam fora do sitemap e de seu índice. Uma categoria com empresas em descendentes ativos continua elegível, conforme os resultados da página. Categorias e associações são lidas em lotes de 1.000, com ordenação estável; falhas de consulta retornam 503.
- Imagens sociais PNG de 1.200 × 630 para empresas e categorias, além de uma imagem padrão. Título e descrição vêm do catálogo público, nunca de texto na query string. URLs incluem a atualização do registro e parâmetros extras redirecionam à URL canônica.
- Perfis e cards reservam as dimensões das imagens e usam `next/image`. A otimização permite assets locais e Storage público no projeto Supabase configurado. Logos em outros domínios continuam carregados diretamente pelo navegador. Falha na otimização usa a imagem original.
- Binding `IMAGES` no Worker existente. Não há criação de armazenamento de imagens, alteração de assinatura do Cloudflare ou mudança de banco/RLS. O preview continua bloqueado para indexação.

## Validação

Executar somente na nuvem, pelo workflow `Selletive Preview`, usando `application_only=true` para preservar as credenciais existentes e verificar que as migrações continuam iguais à base aprovada.

O workflow inclui typecheck, lint/formatação, builds Next/OpenNext, geração dos tipos de bindings, regressões de hierarquia/paginação/falhas/URLs e renderização dos links. A verificação remota confere os PNGs, metadados de categoria, exclusão de categorias vazias, bloqueio de origem não autorizada e largura efetiva de uma imagem otimizada, além das verificações existentes.

O runner é Ubuntu 24.04 e a verificação usa o Chrome já instalado na imagem oficial via `SELLETIVE_BROWSER_CHANNEL=chrome`. Isso evita depender de uma instalação adicional de Chromium/apt durante cada publicação. As mesmas asserções Playwright são preservadas. Referências: [imagem do runner](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md), [canais suportados pelo Playwright](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge).

Revisão adversarial: Track A sem bloqueios; Track B identificou uma expectativa incorreta no teste remoto para associações somente a categorias inativas. Uma revisão independente confirmou o problema e o teste passou a filtrar categorias ativas. Nenhum esquema ou política foi alterado.

Referências: [Next ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response), [OpenNext Images](https://opennext.js.org/cloudflare/howtos/image), [Cloudflare Images binding](https://developers.cloudflare.com/images/optimization/binding/), [limites e preços](https://developers.cloudflare.com/images/pricing/). A documentação do Next foi lida do pacote exato 16.4.1 do projeto, extraído em diretório temporário porque não há dependências instaladas nesta máquina.

## Resultado em 06/11/2026

[CI 42274912002 aprovado](https://github.com/darknight3737/fuzzy-odyssey/actions/runs/42274912002), commit de aplicação `f9627dcf`: typecheck, lint/formatação, regressões, geração dos tipos, builds Next/OpenNext, deploy e verificação remota com Chrome 156 passaram. O preview permanece em https://selletive.frd-monteiro97.workers.dev, bloqueado para indexação.

Confirmados remotamente: PNG de 1.200 × 630, metadados/imagem de categoria, imagem de empresa inexistente com 404, origem de imagem não autorizada com 400, imagem otimizada embutida com largura real 64, exclusão de categorias vazias do sitemap, ausência de erros de navegador, navegação e responsividade nos tamanhos existentes do teste. O PNG padrão também foi inspecionado visualmente; a imagem otimizada foi conferida como 64 × 46 pixels.

Os links de perfis e os casos de hierarquia/paginação/falha foram exercitados com fixtures isoladas no CI. A verificação remota usou o catálogo disponível, sem inserir empresas ou usuários de teste no banco. Nenhuma aplicação ou suíte de testes foi executada localmente.
