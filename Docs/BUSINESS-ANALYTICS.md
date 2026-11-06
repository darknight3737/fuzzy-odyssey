# Analytics por empresa

Escopo: visualizações do perfil e cliques em site, telefone e e-mail. Não são leads confirmados, mensagens enviadas, ligações realizadas ou vendas. Não há novo formulário de contato, Signal, patrocínios ou alteração de preços.

## Coleta e leitura

- Perfis de todos os tiers geram contagens, inclusive os gratuitos. Proprietários de Highlight e Spotlight veem o painel em `/home/businesses/[slug]`: quatro totais e 30 dias em UTC, incluindo hoje, com tabela diária e estados vazio/indisponível.
- Leitura usa o cliente normal e RLS. Somente o proprietário pessoal atual de uma empresa Highlight/Spotlight pode ler. A restrição de MFA é adicional. Outros usuários, proprietários anteriores, contas gratuitas e visitantes não recebem os números nem as chaves de deduplicação. Não existe permissão automática para membros de equipe ou super-admins nesta funcionalidade.
- Coleta acontece no navegador quando o perfil é ativado e visível. Metadados, prefetch e SSR não contam. Links continuam funcionando quando analytics falha ou JavaScript está desativado.
- Servidor exclui o proprietário autenticado, agentes de robôs conhecidos e DNT/GPC. Um proprietário sem sessão pode contar como visitante. Bloqueadores, falhas de rede e robôs não reconhecidos limitam a precisão.
- Deduplicação por conexão/IP, ação, empresa e dia UTC. Uma rede compartilhada pode ficar subestimada. Não apresentar esses números como visitantes únicos ou taxa de conversão.
- HMAC diário calculado no servidor com segredo privado; IP, user-agent, URL de origem e destino de contato não são armazenados nas tabelas. Nenhum cookie de analytics. Chaves do dia atual/anterior são removidas pela próxima ingestão após expirarem; os agregados são preservados. A política pública descreve essa coleta.
- A data usada no HMAC também é enviada pelo servidor ao RPC; requisições atravessando meia-noite continuam no mesmo dia. O RPC aceita apenas hoje/ontem. O cliente não escolhe data, proprietário, contador ou hash.
- Endpoint valida origem configurada, Fetch Metadata, JSON estrito e até 512 bytes reais. Ausência de IP confiável Cloudflare não gera evento. O RPC só pode ser chamado por `service_role`, é SECURITY INVOKER e atualiza dedupe/contador atomicamente. Limite de 200 eventos distintos por conexão/dia, serializado por advisory lock.

## Operação e limites

Não exige ferramenta externa de analytics ou assinatura adicional. A coleta só funciona atrás do edge Cloudflare e com o segredo Supabase configurado no Worker. Dados começam na ativação: nenhum histórico foi fabricado. Contagens indicativas podem sofrer manipulação por clientes que imitam navegadores ou usam múltiplos IPs; não servem para faturar cliques ou comprovar resultado comercial.

Billing continua desabilitado no preview; a autorização consulta o tier atribuído pela plataforma. Esta entrega não habilita checkout ou modifica planos. Histórico coletado enquanto gratuito torna-se visível ao proprietário se a plataforma mudar o tier para Highlight/Spotlight.

A tabela de dedupe é operacional e descartável; os agregados são dados persistentes. Rollback seguro da aplicação pode preservar ambas as tabelas sem impacto nas funcionalidades anteriores. Reverter os dados exige backup e aprovação separada; não incluir DROP em rollback automático.

## Validação

A migração é gerada de `schemas/21-business-analytics.sql` com `supabase db diff` em banco descartável de GitHub Actions; revokes explícitos são adicionados após revisar o diff. O workflow `selletive-database.yml` aplica todas as migrações, executa pgTAP, ataca acesso entre contas/MFA/tier/reassignment, prova 16 submissões paralelas contando uma vez e verifica ausência de drift nos objetos novos. Tipos são gerados pelo banco na CI.

O workflow do preview executa typecheck, lint/formatação, regressões do endpoint, builds Next/OpenNext e verificação remota. Não executar aplicação ou testes localmente.

Resultado de 06/11/2026: [CI 42311030489](https://github.com/darknight3737/fuzzy-odyssey/actions/runs/42311030489) aprovada: 378 testes pgTAP, 16 envios concorrentes contando uma vez, ausência de drift nos objetos novos, typecheck, lint/formatação, regressões de SEO/ingestão, build canônico e navegador com coleta, contatos, login, painel, exclusão do proprietário e downgrade. Todos os fixtures foram descartados no runner.

Publicação pendente: a integração Supabase retornou confirmação expirada ao aplicar a migração; nenhuma tabela de analytics foi criada no projeto hospedado. O token Management API da automação de deploy também segue sem renovação. Não alterar a referência de esquema verificado do deploy de recuperação antes de aplicar e conferir esta migração.

[Validação final 42312733640](https://github.com/darknight3737/fuzzy-odyssey/actions/runs/42312733640) aprovada: repetiu todos os testes e o navegador, gerou bindings e compilou o bundle OpenNext/Cloudflare sem publicação. Revisões adversariais de qualidade, lógica e RLS concluíram código pronto e isolamento comprovado no escopo testado.
