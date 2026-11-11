# Piloto de importação Apollo — 11/11/2026

Projeto exclusivo: Selletive (`cnagsmkfjkxyxlefrkhu`), conta conectada
Bookselects/Selletive. Nenhuma alteração no Bookselects.

## Resultado

- 400 candidatas preparadas a partir do CSV de 13.293 registros.
- Dois subagentes Luna classificaram lotes compactos: 295 aprovadas e 105 excluídas.
- 295 empresas inseridas sem proprietário, `unclaimed`, verificação `pending`.
- 10 categorias adicionadas como dados: oito especialidades e dois agrupamentos.
  SEO, mídia paga, redes sociais, conteúdo e e-mail ficam em Marketing;
  produção de vídeo fica em Vídeo e animação; desenvolvimento de software e
  aplicativos ficam em Software e aplicativos.
- 142 localidades, 1.702 vínculos de categorias e 885 vínculos de localização.
- Sem migrações, novas tabelas, mudanças de RLS, criação de usuários ou alterações
  na aplicação. As páginas dinâmicas exibem os novos dados sem outro deploy.

## Processo e rastreabilidade

Rotina: `scripts/selletive-import/README.md`. Limpeza/deduplicação sem modelo,
classificação com allowlist e evidência da descrição, tradução concisa, validação
de hierarquia e identidade antes da execução. IDs UUIDv5 estáveis por Apollo ID.
Decisões reutilizáveis evitam reclassificar registros inalterados.

A integração SQL retornou erro interno de autenticação do PostgreSQL, embora a
API REST estivesse saudável. A importação usou uma função Edge temporária com
payload imutável, segredo de serviço restrito ao ambiente Supabase, autorização
aleatória com expiração e destino fixo. Ao concluir, a função foi substituída por
um handler HTTP 410. Não existe endpoint de importação ativo.

CSV, decisões, checksums, payload e resultado ficam em
`scripts/selletive-import/.runs/20261111-pilot/`, ignorado pelo Git. Nenhuma chave
de serviço foi extraída. As chaves temporárias de execução não são arquivadas.

## Verificação e limites

CI executa testes do importador, preparação, typecheck, lint e formatação.
Revisão adversarial corrigiu retomada de vínculos, identidade da fonte e
validação dos ancestrais. A API pública confirmou todas as empresas esperadas,
todos os vínculos e exatamente uma categoria/localidade principal por empresa.

Os dados são derivados do Apollo e continuam pendentes de conferência externa;
o piloto não representa verificação de cada site ou afirmação comercial.
O preview permanece com noindex, conforme o fluxo de lançamento existente.

- Busca: https://selletive.frd-monteiro97.workers.dev/search
- Exemplo: https://selletive.frd-monteiro97.workers.dev/company/agencia-acerte-01885f70
