# Importação Apollo → Selletive

Destino exclusivo: projeto `cnagsmkfjkxyxlefrkhu`. O primeiro lote usa o esquema
atual: empresas sem proprietário, plano `unclaimed`, verificação `pending`, sem
avaliações inventadas. Não cria usuários nem altera permissões/RLS.

## Preparação econômica

```sh
python3 scripts/selletive-import/prepare.py --input /caminho/apollo.csv --output-dir /tmp/selletive-import --limit 400
```

Para continuar sem reavaliar empresas já analisadas:

```sh
python3 scripts/selletive-import/prepare.py --input /caminho/apollo.csv --output-dir /tmp/novo-lote --limit 360 --exclude-reviewed /caminho/lote-anterior/candidates.ndjson --existing-businesses /tmp/novo-lote/businesses.json
```

`--exclude-reviewed` aceita múltiplos arquivos. `--existing-businesses` usa um
snapshot público atualizado e paginado para excluir domínios já cadastrados.
As descrições e palavras-chave são preservadas integralmente: não corte o texto
por número de caracteres antes da classificação. Para economizar tokens, envie
nome, domínio e descrição completa; consulte palavras-chave apenas quando úteis.
Escolha as categorias mais específicas sustentadas pelos serviços descritos.
Ao atingir a meta, guarde as decisões aprovadas excedentes para o próximo lote;
não as marque como rejeitadas por qualidade.

A limpeza e a deduplicação rodam sem tokens. O CSV original, `rows.json`, as
classificações, os snapshots e o payload ficam fora do Git. `Account Owner` no
Apollo é o responsável no CRM, nunca o proprietário da empresa na Selletive.

Leia snapshots públicos paginados de `categories`, `locations` e `businesses`
antes de preparar cada lote. Guarde `categories.json` e `locations.json` no
mesmo diretório. Os snapshots incluem IDs, slugs, pais, níveis/tipos e estado ativo.

Revise os candidatos com Luna em lotes compactos. Cada decisão NDJSON contém:
`id`, `categories` (1–3 slugs específicos, principal primeiro), `description_pt`
(frase curta factual), `reason` e `exclude` booleano. Use a descrição como
 evidência; palavras-chave só como apoio. Não use a coluna Technologies como
prova de serviços vendidos. Exclua software próprio sem prestação de serviços,
empresas fora do escopo e divergências de identidade. Preserve as decisões para
reuso: apenas registros novos/alterados precisam de nova classificação.

## Aprovação e execução

```sh
python3 scripts/selletive-import/assemble.py --input /caminho/apollo.csv --directory /tmp/selletive-import --decisions /tmp/selletive-import/classified-0.ndjson /tmp/selletive-import/classified-1.ndjson
python3 scripts/selletive-import/bundle.py --directory /tmp/selletive-import
```

O assembler valida cobertura, categorias permitidas, localização e duplicados.
Adiciona ancestrais das categorias e país/estado/cidade. IDs derivam de Apollo ID
via UUIDv5; slugs incluem um sufixo estável. Estados usam `estado-de-…` no slug
para não colidir com cidades homônimas. Não publica dados internos do CRM.

`manifest.json` registra checksum do CSV/payload, IDs e slugs. Não sobrescreva
runs: correções usam um diretório novo. O bundle exige checksum válido e gera
uma autorização aleatória privada de 256 bits, válida por duas horas.

Publique `edge-bundle/main.js` e `edge-bundle/payload.json` como uma função
Supabase temporária pelo conector da conta **Bookselects/Selletive**. O executor
faz sua própria autenticação por `x-import-token`, portanto use `verify_jwt=false`.
Não imprime nem retorna chaves de serviço. O corpo da chamada POST deve ser vazio;
a função só pode consumir o payload imutável incluído no deploy.

Antes de executar, rode o workflow `Selletive Import Checks` no GitHub. A aplicação
e todos os testes rodam apenas no CI ou no preview remoto. Confira a rejeição de
uma chamada sem autorização; execute uma chamada autorizada e guarde o resultado
no diretório privado. Verifique contagens, vínculos e páginas pelo acesso público.
Ao concluir, substitua a função por um handler que sempre responde HTTP 410.

## Segurança, retomada e limites

O executor só insere dados. Ignora IDs existentes e domínios já cadastrados;
não altera perfis reivindicados. A retomada completa apenas vínculos ausentes de
perfis com mesmo ID e conteúdo do lote, sem proprietário e sem edições desde a criação.
Categorias e localidades existentes são reutilizadas após conferir ID/slug.
Não há chave de serviço no repositório ou no computador: a função usa o segredo
do próprio ambiente Supabase, com destino fixo.

Cada requisição REST é transacional; **o lote inteiro não é uma transação**.
Falhas retornam estágio, contagens e `complete:false`; pode haver registros
parciais. Não declare o lote completo antes de reconciliar todos os vínculos.
Uma repetição após sucesso não duplica empresas. Após falha, a retomada verifica
conteúdo, propriedade e timestamps antes de completar vínculos ausentes; perfis
reivindicados ou editados ficam fora desse reparo. Não faça rollback com
DELETE em massa; qualquer remoção exige IDs do manifesto e conferência de que o
perfil continua não reivindicado. Chamadas concorrentes não substituem a fila
operacional: execute apenas uma por lote.

Não houve validação externa de todas as afirmações do Apollo. Os perfis importados
continuam pendentes de verificação; revisões futuras devem consultar o site oficial.
