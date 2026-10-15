# Migração da Selletive para Makerkit v4

Concluída em 15/10/2026, na branch `upgrade/makerkit-v4`. Base oficial: Makerkit **4.1.6**, commit upstream `c81fab72600fc45986ca18275b3463ac48bd88e0`. Next.js 16.4.1, React 19.3.1, next-intl, Base UI, next-safe-action, Zod 4, Oxc e Cache Components estão integrados.

## Recuperação do estado anterior

Antes de atualizar, todo o trabalho existente foi commitado em `367c5abd7978395ee84f8b906706e176a1464cda` e marcado com a tag `backup/selletive-before-makerkit-v4-20261015`. A branch `work` continua apontando para esse estado.

Backup independente: `/workspace/selletive-pre-v4-20261015.bundle`. Ele foi clonado em outra pasta e o commit e os arquivos personalizados foram conferidos. SHA-256 do bundle: `d9e5c66ff6f6d76328094d1c79e3b0837e6b88e7aa18aec597eca7472222aea8`.

Para consultar a versão anterior sem desfazer a migração:

```bash
git worktree add ../selletive-before-v4 backup/selletive-before-makerkit-v4-20261015
```

Se o repositório original não estiver disponível:

```bash
git clone /workspace/selletive-pre-v4-20261015.bundle ../selletive-recovered
git -C ../selletive-recovered switch --detach 367c5abd7978395ee84f8b906706e176a1464cda
```

Copie o bundle para armazenamento durável. Ele recupera código e histórico; não é backup de dados do Supabase. Nenhum banco remoto foi alterado e nada foi publicado.

## Implementação preservada

- Home, identidade visual, conteúdo e páginas comerciais e jurídicas da Selletive.
- Empresas, categorias, filtros, busca, perfis públicos, avaliações e conteúdo premium.
- Reivindicação por e-mail corporativo confirmado, painel Minhas empresas e edição do perfil.
- Contato persistido no banco e administração de mensagens e avaliações.
- URLs existentes sem prefixo obrigatório de idioma, canônicas, dados estruturados, `noindex`, sitemaps paginados e HTTP 404 antes do streaming.
- Esquemas, tabelas e migrações personalizados 18/19/20. Nenhuma tabela nem coluna do produto foi removida.

A migração incorporou primeiro a linha v2 LTS, depois as etapas oficiais da v3 e da v4. Como o fork não tinha ancestral Git em comum com o repositório oficial, foi estabelecida uma ligação de histórico com a tag original 2.13.1, sem mudar a árvore local. Os merges seguintes passaram a comparar alterações de ambos os lados.

As rotas agora ficam em `app/[locale]`. O idioma padrão continua português, com detecção automática desativada para preservar os endereços existentes. As traduções próprias foram convertidas para next-intl; namespaces do boilerplate sem tradução portuguesa mantêm fallback em inglês.

O conteúdo público usa uma conexão anônima independente das sessões. A home tem cache compartilhado com a tag `directory`; reivindicação, edição e moderação invalidam essa tag. Conteúdo por usuário permanece atrás de limites de Suspense e verificações de acesso. A reivindicação ficou fora do grupo de marketing, cuja renderização estática continua obrigatória.

Também foram corrigidos o retorno para reivindicação/convite após cadastro e login, as regras de autenticação para URLs com idioma, a exclusão de sitemaps do roteamento de idiomas e os caminhos de invalidação que contêm parâmetros dinâmicos.

## Verificações executadas

- `pnpm typecheck`: todos os 32 pacotes.
- `pnpm lint:fix` e `pnpm format:fix`, com Oxc.
- Build de produção com Webpack, Cache Components e prefetch parcial ativos; 183 páginas geradas.
- Cinco testes Playwright do diretório: cadastro → e-mail de confirmação → sessão → reivindicação → edição persistida → perfil público; busca, celular, 404 e sitemaps.
- Todas as migrações aplicadas a um PostgreSQL 17 descartável, com GoTrue 2.196.0, PostgREST 14.17 e Mailpit reais.
- Suíte pgTAP: 355 verificações sem falhas, incluindo permissões, contas, equipes, convites, dados de cobrança, MFA/admin e regressões do diretório.
- Dois clientes concorrentes tentaram reivindicar a mesma empresa com domínios válidos: exatamente um venceu e o outro recebeu rejeição de duplicidade.
- Tipos do banco regenerados a partir do esquema combinado efetivamente migrado, nos dois destinos do monorepo.

O teste novo de ciclo de reivindicação está em `apps/e2e/tests/directory/claim-lifecycle.spec.ts`. Usa o Supabase e o Mailpit locais padrão; uma instalação de QA pode sobrescrever `SUPABASE_TEST_URL`, `SUPABASE_TEST_SERVICE_ROLE_KEY` e `MAILPIT_URL`. A chave privilegiada é usada apenas na preparação e limpeza das próprias fixtures do teste.

O ambiente de execução exigiu Webpack por restrições de processos/portas do Turbopack. O carregador nativo comprimido do SWC 1.16.18 também rejeitou a propriedade dos diretórios deste sandbox; a validação local usou o binário nativo compatível 1.15.21 para o carregamento do plugin de configuração. Nenhum desses ajustes foi aplicado às dependências ou à configuração de produção do repositório.

Os testes de banco usaram as permissões padrão da plataforma Supabase e uma estrutura mínima de Storage para testar SQL/RLS. O serviço Storage e `pg_cron` não foram exercitados. OAuth, recuperação de senha, MFA no navegador e pagamentos externos não foram validados de ponta a ponta nesta migração. Testes SQL de cobrança não equivalem a testar o gateway de pagamentos.

As revisões adversariais de código e RLS foram executadas, incluindo uma revisão independente dos resultados. A cobertura de isolamento está limitada às operações testadas. Os grants amplos de UPDATE e as políticas de badges dos esquemas personalizados são herdados e não constituem uma auditoria completa aprovada. Os esquemas declarativos 18/19 também continuam dependendo de grants explícitos presentes nas migrações históricas; revise esse alinhamento antes de gerar novas migrações por diff.

## Arquivo suspeito removido

Foi encontrado no estado anterior um `preinstall.js` ofuscado com seletores de variação Unicode e AES. Sua análise estática identificou descoberta de endereço externo via Solana e execução de payload remoto com `eval`/`vm`. O arquivo foi removido, sem executá-lo. Não havia referência a ele nos scripts de instalação dos manifestos analisados. Não é possível determinar por esta análise se foi executado em ambientes anteriores.

SHA-256 do arquivo original: `8bd8cc06ca9d854215d70fef229fe02ba0b5deb7bf6cbc85a943d60f597ebd26`. Ele continua no commit/tag de recuperação; não o execute ao consultar o backup.

## Antes da publicação

Use `Docs/LAUNCH-READINESS.md` para configuração do projeto Supabase definitivo, domínio, e-mail e revisão dos dados fictícios históricos. Faça backup do banco remoto antes de aplicar as migrações. Reverter apenas o Git não reverte dados nem permissões do banco.
