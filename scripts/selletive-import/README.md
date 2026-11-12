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

Para reduzir tokens em lotes maiores, use regras conservadoras sobre as
descrições completas, sem enviar todos os registros ao modelo:

```sh
python3 scripts/selletive-import/classify_explicit.py --candidates /tmp/novo-lote/candidates.ndjson --categories /tmp/novo-lote/categories.json --output /tmp/novo-lote/classified.ndjson
```

O classificador exige identidade compatível, um prestador de serviços no início
do texto e serviço específico junto de verbo de oferta na mesma frase. Cada
categoria conserva a frase de evidência. Casos sem regra, produtos e frases com
negação ficam de fora; ausência de classificação não significa rejeição da
empresa. Uma frase que mistura serviço oferecido e outro negado também é
ignorada por precaução. Revise uma amostra com Luna e encaminhe apenas dúvidas
que sejam necessárias para completar a meta. Não infira serviços a partir de
tecnologias utilizadas ou do setor dos clientes.

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

## Triagem do arquivo inteiro

Para processar todos os registros, sem limitar a setores ou exigir cidade/estado
que não existem na origem:

```sh
python3 scripts/selletive-import/prepare_remaining.py --input /caminho/apollo.csv --existing-businesses /tmp/snapshots/businesses.json --directory /tmp/triagem
python3 scripts/selletive-import/taxonomy_additions.py --categories /tmp/snapshots/categories.json --output /tmp/triagem/classification-categories.json
python3 scripts/selletive-import/classify_remaining.py --candidates /tmp/triagem/candidates.ndjson --categories /tmp/triagem/classification-categories.json --output /tmp/triagem/decisions.ndjson
```

`ledger-prepared.json` contabiliza **cada linha** do CSV, inclusive duplicatas e
registros sem dados suficientes. Nunca trate abstenções das regras como prova
que a empresa não presta o serviço: são pendências. Preserve também bloqueios
manuais de identidade de revisões anteriores.

As novas categorias completam serviços profissionais, gestão de TI, dados/IA e
software empresarial previstos no PRD. `taxonomy_additions.py` gera uma visão
prospectiva para a classificação. **O assembler recebe o snapshot real**, sem
categorias prospectivas: ele cria apenas as folhas utilizadas e seus ancestrais.
Não sobrescreva nem reclassifique perfis já publicados.

O país Brasil é obrigatório. Se estado/cidade não constam no CSV, a importação
salva apenas os dados conhecidos, sem inferir localização. A localização mais
específica conhecida é a principal. Cidade sem estado permanece no endereço,
mas não cria uma associação geográfica ambígua.

Separe decisões aprovadas em lotes equilibrados de 200–350 empresas e preserve
os manifestos individuais. Execute sequencialmente com o mesmo executor
restrito. Reconcile o total e os vínculos ao final; confira que os perfis e
vínculos anteriores permanecem idênticos. Arquive a triagem completa e as
pendências em `.runs/`, sem tokens temporários de autorização, e desative o
endpoint após terminar.
