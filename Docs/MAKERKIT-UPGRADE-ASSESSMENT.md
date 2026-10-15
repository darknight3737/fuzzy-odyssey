# Avaliação de atualização do Makerkit

Data da avaliação: 15 de outubro de 2026.

## Decisão

A Selletive pode migrar para o Makerkit atual preservando suas funcionalidades e seus dados, mas isso exige adaptar o código personalizado e validar cada etapa. Não recomendo aplicar a migração completa para v4 nesta fase de preparação para o lançamento. Nesta avaliação, nenhuma dependência, rota, componente ou migração de banco foi alterada.

A recomendação é primeiro atualizar a linha v2 LTS, mantendo o produto funcional, e tratar a passagem v2 → v3 → v4 como uma migração separada. Adiar a troca de arquitetura não significa adiar correções de segurança das dependências.

## Versões verificadas

| Item | Versão observada | Evidência |
| --- | --- | --- |
| Base do projeto local | 2.13.1 | `package.json` na raiz |
| Next.js local | 15.5.2 | `apps/web/package.json` |
| Makerkit na branch oficial `main` | 4.1.6 | `package.json` consultado pelo GitHub conectado |
| Makerkit na branch oficial `v2` | 2.28.5 | `package.json` consultado pelo GitHub conectado |
| Next.js da branch oficial `main` | 16.4.1 | Catálogo em `pnpm-workspace.yaml` |

As versões são um retrato desta consulta; as branches podem avançar.

Fontes oficiais:

- [Changelog](https://makerkit.dev/changelog)
- [Manifesto atual do Makerkit](https://github.com/makerkit/next-supabase-saas-kit-turbo/blob/main/package.json)
- [Manifesto da linha v2](https://github.com/makerkit/next-supabase-saas-kit-turbo/blob/v2/package.json)
- [Catálogo de dependências atual](https://github.com/makerkit/next-supabase-saas-kit-turbo/blob/main/pnpm-workspace.yaml)

## Impacto concreto na Selletive

### UI, traduções e formulários

A passagem para v3 troca Radix por Base UI, i18next por next-intl e `enhanceAction` por next-safe-action, além de atualizar Zod e as ferramentas de desenvolvimento. O roteiro oficial distribui essa transição em dez etapas e mantém uma branch v2 com manutenção.

No código local, encontrei 61 arquivos TSX com referências a `Trans`, `withI18n` ou react-i18next e 17 arquivos TypeScript com referências a `enhanceAction`. Esses números incluem a base e as customizações; não são uma contagem de conflitos de merge. Claim, edição de empresas, contato e moderação usam essas APIs.

As implementações podem ser transportadas. Uma atualização somente dos números em `package.json` não representa a atualização do Makerkit e não resolve essas mudanças.

Fonte: [migração oficial v2 → v3](https://makerkit.dev/docs/next-supabase-turbo/installation/v3-migration).

### Renderização, autenticação e SEO

A v4 altera cache, layouts e organização da busca de dados; o roteiro detalhado possui nove etapas. O benefício principal é desempenho de navegação e cache.

Nossa home consulta empresas e categorias. O layout público consulta a sessão no servidor, o cliente Supabase usa cookies e os metadados raiz leem headers. Essas dependências precisam ser separadas antes de aplicar as garantias de páginas estáticas do kit novo. Cache compartilhado deve conter somente informações públicas.

A Selletive também possui URLs próprias para categorias, empresas e combinações de categoria/local. A migração precisa manter as URLs atuais em português ou implementar redirecionamentos permanentes, canônicas e sitemaps coerentes. Prefixos de idioma não devem ser introduzidos automaticamente. Devem ser novamente testados os HTTP 404 anteriores ao streaming e o `noindex` de páginas vazias e filtros.

Fonte: [migração oficial v3 → v4](https://makerkit.dev/docs/next-supabase-turbo/installation/v4-migration).

## Preservação do que já existe

O trabalho atual inclui alterações ainda não commitadas e novos arquivos de claim, painel, SEO e banco. Eles foram preservados. Não executei pull, merge, stash, reset de banco ou sobrescrita de arquivos da aplicação.

O GitHub conectado confirmou acesso de leitura ao repositório oficial, permitindo conferir os manifestos privados. O `git ls-remote` pelo terminal falhou na conexão com o proxy nesta sessão. Não houve simulação de merge nem comparação completa do código upstream; portanto não afirmo um número exato de conflitos ou uma garantia de ausência de regressões.

## Caminho recomendado

1. Criar um checkpoint versionado de todo o trabalho atual e uma branch de atualização.
2. Comparar e integrar a branch oficial v2, incluindo correções de dependências e compatibilidade com o framework.
3. Validar claim, gestão, permissões, moderação, contato, URLs e SEO. A autenticação com um projeto Supabase real continua sendo uma validação necessária; a atualização do kit não substitui isso.
4. Quando houver cobertura e ambiente adequados, migrar pelas etapas oficiais de v3 e depois v4, preservando o design da Selletive e suas regras de negócio.
5. Confirmar isolamento de sessões em páginas públicas, invalidação de cache após alterações e consistência dos sitemaps antes de integrar a migração.

Não foram executados novos testes de aplicação porque esta tarefa resultou em avaliação e documentação, sem alteração de código executável. As validações da implementação anterior estão descritas em `Docs/LAUNCH-READINESS.md`.
