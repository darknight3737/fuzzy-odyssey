# Selletive — implementação e preparação de publicação

A aplicação no repositório implementa o diretório gratuito, com interface minimalista, busca, perfis, reivindicação e gestão. O Signal não foi implementado.

## Fluxos disponíveis

- Home com busca real, categorias e empresas carregadas do banco; estados vazios sem números ou depoimentos inventados.
- Busca por nome, descrição ou especialidade, filtros de categoria/local e paginação de 24 resultados.
- Categorias que incluem empresas das subcategorias; páginas por categoria/local geradas a partir das associações existentes.
- Perfil público, contatos, conteúdo premium existente, avaliações aprovadas e CTA para reivindicação.
- Claim gratuito usando o e-mail confirmado de uma conta autenticada, com domínio correspondente ao site da empresa. O domínio é conferido no banco usando `auth.users`, não em metadados editáveis do usuário.
- Transferência atômica de propriedade com bloqueio de linha. Perfis importados podem ter `account_id = NULL`; nenhuma conta artificial precisa ser criada.
- Painel pessoal em `/home` e edição em `/home/businesses/[slug]`.
- Avaliações de usuários autenticados entram pendentes. A empresa não pode avaliar a si mesma, aprovar avaliações ou se autoverificar. Moderação em `/admin/reviews` exige administrador com MFA.
- Contato persistido em `contact_messages`, com caixa de entrada em `/admin/contact-messages`. O envio não depende de credenciais SMTP.

## SEO implementado

- Renderização dos dados no servidor, metadados próprios e URLs canônicas.
- `Organization` nos perfis; `ItemList` e `BreadcrumbList` nas páginas locais; `WebSite` na home e FAQ correspondente ao texto visível.
- Escape de JSON-LD para impedir que dados do banco fechem a tag de script.
- Sitemap indexado e dividido em lotes de 1.000 URLs. Empresas, categorias e combinações locais reais são incluídas. Não há produto cartesiano de cidades e especialidades sem empresas.
- Páginas locais/categorias vazias e resultados de busca recebem `noindex`. Parâmetros de filtros não criam novas URLs canônicas indexáveis.
- URLs de diretório inexistentes são verificadas no middleware antes do streaming e retornam HTTP 404.
- Aliases locais redirecionam permanentemente para o slug principal.
- Datas do sitemap vêm do conteúdo; páginas estáticas não inventam uma atualização a cada acesso.
- Fontes nativas eliminam a dependência de downloads de fontes durante a compilação e no primeiro carregamento.

## Entrada de empresas

Depois de aplicar a migração `20261015134614_directory_claim_and_seo.sql`, cadastre empresas em `public.businesses` com `tier = 'unclaimed'` e `account_id = NULL`. Forneça um site oficial HTTPS para permitir a reivindicação por domínio.

Exemplo de estrutura, substituindo os valores pelo cadastro real:

```sql
begin;

insert into public.businesses
  (name, slug, description, website, email, phone, tier, account_id)
values
  ('Nome da empresa', 'slug-unico-da-empresa',
   'Descrição original e detalhada dos serviços da empresa.',
   'https://dominio-oficial-da-empresa.com.br',
   'contato@dominio-oficial-da-empresa.com.br', null, 'unclaimed', null);

-- Associe uma ou mais especialidades existentes.
insert into public.business_categories (business_id, category_id, is_primary)
select b.id, c.id, true
from public.businesses b, public.categories c
where b.slug = 'slug-unico-da-empresa' and c.slug = 'web-development-services';

-- Cadastre o local real e associe a empresa. Use os slugs da hierarquia existente.
insert into public.locations (name, slug, type, country_code, state_code)
values ('São Paulo', 'sao-paulo-sp-br', 'city', 'br', 'sp')
on conflict (slug) do nothing;

insert into public.business_locations (business_id, location_id, is_primary)
select b.id, l.id, true
from public.businesses b, public.locations l
where b.slug = 'slug-unico-da-empresa' and l.slug = 'sao-paulo-sp-br';

commit;
```

Associe categorias/localidades reais. Descrições específicas, serviços demonstráveis e dados completos são necessários para que as páginas tenham valor para visitantes e mecanismos de busca. Os nomes e descrições das categorias são conteúdo do banco e podem ser traduzidos sem alterar as URLs existentes.

## Verificação

- TypeScript verificado com `tsc --noEmit` em `apps/web`.
- ESLint nos arquivos TypeScript alterados e formatação com Prettier.
- Compilação de produção do Next.js, usando variáveis locais de QA.
- Testes Playwright em `apps/e2e/tests/directory/public-directory.spec.ts`: busca da home, ausência de overflow no celular, HTTP 404 e sitemap.
- Navegador Chromium real nas páginas públicas, em desktop e celular.
- Regressões SQL em `apps/web/supabase/checks/directory-claim-security.sql`: anonimato, domínio incorreto, e-mail não confirmado, claim válido/repetido, troca de propriedade, autoverificação, edição autorizada/não autorizada, autoavaliação, privacidade do e-mail e moderação.

O ambiente completo do Supabase excedeu o disco durante a extração da imagem. As migrações foram verificadas em PostgreSQL 15 isolado, com estruturas mínimas de Auth/Storage; a extensão `pg_cron` não foi exercitada. O PostgREST real foi usado para a navegação e a persistência do contato. Cadastro, confirmação por e-mail, recuperação de senha, MFA e OAuth ainda precisam de validação com um projeto Supabase real antes de publicar.

## Dependências externas e pendências de lançamento

Não existe projeto Vercel vinculado ao repositório nas conexões consultadas. Nenhum projeto Supabase disponível pôde ser identificado como pertencente à Selletive. Nenhuma infraestrutura paga foi criada e nenhum banco remoto foi modificado.

Para publicar:

1. Identificar o projeto Supabase correto, aplicar as migrações e configurar Auth/URLs de retorno e o provedor de e-mail.
2. Configurar `NEXT_PUBLIC_SITE_URL` com o domínio HTTPS definitivo, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLIC_KEY` e as demais variáveis do ambiente. A chave de serviço deve permanecer exclusivamente no servidor.
3. Revisar os dados fictícios já existentes na migração histórica `20250927170839_fictional-businesses.sql`. Eles não devem ser publicados como empresas reais. Não foram removidos de nenhum banco externo.
4. Configurar o administrador com MFA, validar os fluxos de autenticação reais e publicar a aplicação.
5. Cadastrar o sitemap definitivo no Search Console.

A página pública oferece claim gratuito e contato para opções de destaque. O boilerplate de cobrança foi preservado, mas a sincronização automática de assinaturas com os planos das empresas não foi concluída. Não há checkout pago anunciado na página de preços. A identificação jurídica do responsável pelo tratamento e os canais institucionais definitivos precisam ser definidos antes do lançamento.
