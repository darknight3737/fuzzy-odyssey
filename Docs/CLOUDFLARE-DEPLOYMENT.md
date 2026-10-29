# Selletive: deploy Cloudflare

Estado em 28/10/2026: banco reativado; Worker publicado com isolamento de operações pendentes do Next; preview validado remotamente. URL: https://selletive.frd-monteiro97.workers.dev.

## Recursos exclusivos da Selletive

- Organização Supabase: Sesterce (`kkqpanpyzsijqhbrlqnk`).
- Projeto: Selletive (`cnagsmkfjkxyxlefrkhu`), região `us-west-2`.
- API: `https://cnagsmkfjkxyxlefrkhu.supabase.co`.
- Conta Cloudflare: `197b766a23439aced586d68ea5ec5463`.
- Worker: `selletive`.
- KV: `selletive-opennext-cache`, namespace `ef2629839c3943ca9eee730a912c5d88`.
- Durable Objects SQLite: fila e tags de cache, vinculados ao Worker Selletive.

Bookselects não foi alterado. R2 não é necessário: a implementação usa KV e assets próprios do deploy. Não foi contratado ou ativado outro plano pago. As cotas gratuitas são compartilhadas pela conta; isso não garante hospedagem gratuita para qualquer volume de tráfego. Em particular, KV Free oferece 100 mil leituras/dia, mil escritas/dia e 1 GB de armazenamento. A automação evita popular o KV em massa a cada publicação.

## Compatibilidade Makerkit v4

OpenNext Cloudflare `1.20.12` e Wrangler `4.151.0` estão fixados no lockfile. O adaptador não retomou de forma confiável os shells de Partial Prerendering do Next 16.4: surgiram páginas incompletas e erros React 412/419. O destino Cloudflare usa respostas completas por SSR, preservando componentes, loaders, guards e diretivas de cache de dados. O build Node mantém Cache Components e Partial Prefetching.

O workflow primeiro valida o build canônico, incluindo as declarações `ensureStatic` e `instant`. O wrapper de build Cloudflare omite temporariamente essas duas declarações exclusivas de PPR e restaura os fontes ao terminar, inclusive em SIGINT/SIGTERM. Não executá-lo em paralelo com outra edição desses arquivos. A opção de compatibilidade `experimental.useCache` deve ser revista em futuras atualizações do Next/OpenNext.

`keep_names: false` evita que a etapa esbuild do Wrangler acrescente helpers ao script inline serializado pelo next-themes. Os scripts do navegador não dependem de helpers exclusivos do servidor.

Uma correção versionada do adaptador cobre `CacheSignal(null)` do Next 16.4: a regra original reconhecia apenas o construtor sem argumentos e deixava o controle de imports compartilhado entre requisições. No Workers, isso provocava cancelamento de timers de outra requisição. O patch preserva os argumentos e usa o contexto OpenNext, com fallback para o contexto Cloudflare antes de o handler principal iniciar. A mesma regra é aplicada à cópia do Next incluída no middleware externo.

Antes de publicar, a automação faz um dry-run do Wrangler e verifica que todas as implementações de `getModuleLoadingSignal` no JavaScript final usam o estado da requisição. Um teste aplica a regra ao código real do Next instalado e verifica isolamento nos contextos de servidor e middleware. Não há override global de timers.

## Cache e conteúdo

O cache incremental grava no KV; as entradas iniciais do build ficam em assets privados sob `cdn-cgi/_next_cache`, acessíveis pelo binding ASSETS. Exclusão grava tombstone no KV para impedir que uma entrada removida reapareça por fallback. Tags usam Durable Objects. Consistência eventual do KV continua sendo uma característica da plataforma.

O conteúdo Keystatic do repositório é incluído como módulos Text em `.open-next/content`, fora dos assets públicos. No Worker, o reader usa `/bundle/content` no filesystem somente leitura; em Node mantém `process.cwd()`. A filtragem de status publicado permanece. Novas alterações editoriais no repositório exigem outro deploy. O conteúdo de exemplo original do Makerkit foi preservado.

## Banco e Auth

As 21 migrações foram registradas preservando versões originais via Management API na automação GitHub. Na implantação inicial foram conferidas 87 categorias, zero empresas e zero usuários; todas as tabelas públicas têm RLS habilitado. A migração `20250927170839_fictional-businesses.sql` foi registrada sem executar usuários e empresas fictícios. Os arquivos históricos não foram alterados. O catálogo da migração anterior foi aplicado normalmente.

Advisors reportaram avisos sobre cinco RPCs SECURITY DEFINER intencionalmente acessíveis a usuários autenticados, sem erro de tabela pública sem RLS. [Referência](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Isso não representa uma auditoria integral de todas as permissões históricas.

Auth usa a URL de preview e redirects do mesmo domínio, mantendo confirmação de e-mail. O banco começa sem empresas de demonstração; diretório vazio não significa perda de dados anteriores de produção.

## Automação e recuperação

Workflow `.github/workflows/selletive-preview.yml`, acionado por push em `deploy/selletive-cloudflare`. O branch `main` não foi alterado neste deploy. A integração Supabase GitHub precisa apontar para `apps/web/supabase/migrations`; não confiar em migrações automáticas antes de revisar sua configuração e a exceção dos dados fictícios.

Os segredos GitHub `CLOUDFLARE_API_TOKEN` e `SUPABASE_ACCESS_TOKEN` são usados pela automação. As chaves do próprio projeto são obtidas pela Management API, mascaradas nos logs e enviadas atomicamente ao Worker com `--secrets-file`. O arquivo temporário é removido ao final. O webhook usa uma chave derivada estável do projeto. Os IDs do destino são conferidos antes das alterações. Nenhum endpoint do Bookselects é usado.

O desenvolvimento edita os fontes nesta máquina; aplicação, builds e testes executam somente na nuvem. Não iniciar Next, Supabase, Wrangler preview ou servidores de teste localmente. O workflow recompila com a URL e a chave pública da Selletive e valida o site publicado com navegador remoto.

Para recuperação da aplicação sem alterar o banco, o workflow aceita `application_only=true` no acionamento manual. Esse modo exige `apps/web/supabase` sem diferenças contra a tag `selletive-cloudflare-preview-verified-20261016`, usa a variável GitHub `SELLETIVE_PUBLIC_KEY` e preserva os secrets existentes do Worker. Não modifica Auth ou migrações. O caminho completo continua exigindo `SUPABASE_ACCESS_TOKEN` válido; em 28/10/2026 o token salvo retornou HTTP 401 e precisa ser renovado antes de um deploy com mudanças no banco.

O Next 16.4 mantém mapas de preenchimento e revalidação de `use cache` e um sinal de carregamento de módulos compartilhados no processo. Requisições Workers encerradas não podem fornecer I/O pendente às visitas seguintes. O build Cloudflare passa a isolar esses controles pelo contexto de cada requisição nas variantes CJS e ESM do Next **antes** de compilar os chunks das páginas, além da inspeção posterior do bundle. Os fontes instalados são restaurados no `finally`. O cache persistido continua compartilhado; apenas operações em andamento deixam de atravessar requisições. Os testes de CI cobrem promessas pendentes entre contextos, respostas completas com prazo, acessos concorrentes e novas sessões de navegador. Cancelamentos remotos são uma carga adicional de melhor esforço; a regressão determinística usa o código do Next instalado na CI.

Backup anterior à migração: tag `backup/selletive-before-makerkit-v4-20261015`, commit `367c5abd7978395ee84f8b906706e176a1464cda` e bundle `/workspace/selletive-pre-v4-20261015.bundle`. A versão v4 validada em Node está no tag `selletive-makerkit-v4.1.6-verified-20261015`. Commits do deploy permanecem no branch próprio para recuperação independente.

## Verificação

- [Recuperação verificada em 28/10/2026 — execução 40796599664](https://github.com/darknight3737/fuzzy-odyssey/actions/runs/40796599664): typecheck, regressões de cache/carregamento de módulos, dois builds, inspeção do bundle, deploy e navegador remoto aprovados. Requisições concorrentes e novas sessões passaram. Acesso do Brasil confirmou início, categorias e busca com HTTP 200, HTML completo e sem registros de erro de renderização, em aproximadamente 3 segundos por página. Não houve execução local da aplicação ou dos testes.

- [Execução final 38923580838](https://github.com/darknight3737/fuzzy-odyssey/actions/runs/38923580838): todas as etapas aprovadas, incluindo os dois builds, isolamento de requisições, inspeção do bundle, deploy e navegador remoto.
- Build Next.js canônico, bundle OpenNext e typecheck de 32 pacotes aprovados nas validações anteriores.
- Lint sem erros, quatro avisos herdados; formatação aplicada.
- Cache: fallback inicial, atualização, exclusão por tombstone e isolamento de tipos verificados.
- Cancelamento de build: restauração dos dois layouts verificada com SIGTERM em checkout temporário.
- Workers local: início → busca, busca direta, categorias, perfil, login e cadastro renderizaram sem erros de JavaScript.
- CMS local sem assets iniciais e com KV novo: blog, documentação e changelog renderizaram sem erros de JavaScript.
- Contato remoto: formulário confirmou envio, registro foi conferido no Supabase e removido após o teste. Não houve envio de e-mail.
- CMS remoto: três rodadas de leituras paralelas de blog, índice e artigo da documentação passaram, sem erros de JavaScript. Início, busca e categorias também passaram em desktop e celular; a área interna redirecionou visitantes sem sessão para login.
- Revisões adversariais dos ajustes SSR, cache e CMS concluídas sem bloqueios.
- O teste remoto confirmou banco saudável, noindex, navegação início → busca, categorias, 404 de empresa inexistente, blog e documentação no navegador, sem pageerror. HTTP 200 isolado não aprova o preview.

## Limites do preview

A URL é pública. `robots.txt` bloqueia crawling e `X-Robots-Tag` usa noindex/nofollow. A promoção exige ajustar o estágio de build e runtime e recompilar.

Stripe não está configurado; billing está desativado. SMTP próprio/Resend e OAuth Google ainda precisam de credenciais/configuração. O serviço padrão de e-mail do Supabase tem restrições e não permite prometer cadastro aberto com entrega irrestrita. Confirmação de e-mail e pagamentos não estão aprovados em produção; o formulário de contato persiste no banco e foi verificado sem depender de SMTP.

Sem binding IMAGES, imagens raster são entregues no tamanho original. As telas de autenticação ainda contêm textos padrão em inglês. Esses pontos não impedem visualizar o preview, mas devem ser tratados antes do lançamento público.
