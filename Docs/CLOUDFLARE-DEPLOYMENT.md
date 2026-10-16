# Selletive: preparação do deploy Cloudflare

Estado em 15/10/2026: **não publicado**. Esta configuração é uma preparação de preview, não uma implantação validada.

## Recursos identificados

- Organização Supabase: Sesterce (`kkqpanpyzsijqhbrlqnk`).
- Projeto novo criado pelo proprietário: Selletive (`cnagsmkfjkxyxlefrkhu`), região `us-west-2`, ativo.
- API: `https://cnagsmkfjkxyxlefrkhu.supabase.co`.
- Conta Cloudflare: `197b766a23439aced586d68ea5ec5463`.
- Worker planejado: `selletive`; bucket planejado: `selletive-opennext-cache`.
- Nenhum recurso remoto Cloudflare foi criado. Bookselects não foi alterado.

## Bloqueios atuais

1. O MCP Supabase lê o projeto, mas `apply_migration` falhou duas vezes com `Invalid or expired requestState`. Após as falhas, `public` continua sem tabelas e o histórico sem migrações. Não tentar executar a aplicação contra esse banco antes da implantação do esquema.
2. Wrangler não está autenticado. O MCP Cloudflare não compartilha a credencial com o terminal; a consulta das permissões para criar um token também foi negada. É necessário disponibilizar `CLOUDFLARE_API_TOKEN` como segredo do ambiente, com Workers Scripts e Workers R2 Storage para a conta acima. Não colocar valores em Git ou no chat.
3. OpenNext compila, mas o runtime local Workers ainda falha em PPR: busca/perfil podem retornar somente o shell e React 412; em outros requests há conteúdo e React 419. Os mesmos fluxos passaram no servidor Next.js. Não publicar como preview funcional antes de resolver e repetir os testes.

## Configuração preparada

OpenNext Cloudflare `1.20.12` e Wrangler `4.151.0` estão fixados no lockfile. Cache incremental em R2, tags e fila em Durable Objects SQLite, assets e autorreferência usam recursos próprios da Selletive. Cache Components e Partial Prefetching do Makerkit permanecem habilitados. A compilação do adaptador usa Webpack.

```bash
pnpm --filter web cloudflare:build
pnpm --filter web cloudflare:typegen
pnpm --filter web cloudflare:preview
```

Esses comandos pressupõem as variáveis da aplicação configuradas. Os builds locais de validação usaram exclusivamente o Supabase descartável de QA; seus artefatos não devem ser enviados como build de produção. Recompilar com a URL e a chave pública da Selletive, URL final do site e segredos próprios antes do deploy. Nunca reutilizar credenciais do Bookselects.

O preview usa `SELLETIVE_DEPLOYMENT_STAGE=preview`, `robots.txt` bloqueando crawling e `X-Robots-Tag: noindex, nofollow`. Isso não restringe acesso: a URL será pública. A promoção futura exige ajustar o estágio tanto na compilação quanto no runtime e recompilar, pois `robots.txt` é prerenderizado.

## Banco e integração GitHub

As migrações estão em `apps/web/supabase/migrations`, não em `supabase/migrations` na raiz. Verificar o diretório configurado na integração GitHub antes de confiar em implantação automática.

Aplicar a sequência de migrações preservando as versões originais. A migração `20250927170839_fictional-businesses.sql` cria usuários de demonstração e empresas fictícias: não executar no banco de produção; registrar essa versão como aplicada sem executar o conteúdo e documentar essa exceção no histórico de implantação. A migração anterior contém o catálogo de categorias e deve ser aplicada normalmente. Não alterar os arquivos históricos para esconder essa diferença.

Depois do esquema, conferir RLS/grants, advisors, Storage, cron e chaves. Configurar Auth com a URL final e redirects de confirmação/recuperação; verificar SMTP e os segredos de serviços usados. Só então recompilar e testar cadastro, confirmação, login, reivindicação, edição, diretório e contato no destino remoto.

## Evidência local

- Build Next.js Webpack com standalone: passou, 183 páginas.
- Bundle OpenNext: passou.
- Typecheck final: 32 pacotes passaram, incluindo o ajuste de cabeçalhos. Os tipos gerados pelo Wrangler ficam em `.wrangler/` para não incluir o bundle JavaScript na checagem dos fontes.
- Lint: zero erros, quatro avisos herdados.
- Wrangler gerou tipos e perfil de inicialização local (37 ms ativos; não é medição na Cloudflare).
- Playwright no Workers: 2 testes públicos passaram (mobile e 404), 1 falhou (navegação home → busca). O problema de streaming continua aberto.

A revisão também confirmou que, sem binding `IMAGES`, o adaptador entrega imagens raster no tamanho original. Antes do lançamento, configurar otimização ou aceitar esse custo de tráfego. Validar ainda uma leitura fria do CMS: copiar conteúdo para o standalone não comprova acesso ao filesystem no Workers após expiração do cache.

O backup anterior à migração Makerkit continua no tag `backup/selletive-before-makerkit-v4-20261015` e no bundle `/workspace/selletive-pre-v4-20261015.bundle`. A versão v4 validada em Node está no tag `selletive-makerkit-v4.1.6-verified-20261015`.
