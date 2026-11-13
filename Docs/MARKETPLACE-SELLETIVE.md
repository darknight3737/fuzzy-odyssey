# Marketplace Selletive: serviços e software B2B

O diretório preserva as URLs dos perfis importados. Ofertas novas têm tipo
explícito e podem vincular um software ao prestador que o mantém. A migração
classifica como software apenas os registros cuja categoria principal está
na árvore de software empresarial, sem remover associações existentes.

- Busca, categoria e categoria por cidade usam o mesmo RPC paginado, com 24
  resultados por página. Filtros precedem ordenação. Ordenações explícitas
  usam o plano apenas como desempate. A relevância considera reputação e
  plano; o destaque comercial é rotulado.
- Perfis exibem conteúdo por tipo de oferta. Comparação aceita até três
  softwares e favoritos aceitam até cinco empresas no navegador.
- Pedidos diretos ou por categoria são persistidos no Supabase; comprador e
  destinatários conversam em threads privadas. A criação é idempotente,
  tem limite diário e requer consentimento e e-mail confirmado. Exportação
  CSV e envio manual de contatos ao HubSpot são recursos pagos.
- Grátis, Verificado, Destaque e Spotlight mantêm os limites aprovados.
  Valores informativos: R$ 99/mês no Destaque e Spotlight a partir de R$ 299.
  A página capta interesse sem cobrar nem alterar o nível da empresa.
- A simulação de leads mostra premissas editáveis, sem apresentar projeções
  como tráfego medido. Contatos recebidos e cliques são métricas distintas.
- O selo definitivo e a checagem externa são uma etapa posterior. O painel
  explica o fluxo e a verificação continua controlada pela plataforma.
- O Worker público atual permanece em modo preview. Domínio definitivo,
  remoção de noindex e checkout real ficam para a etapa autorizada depois.

Validação: gerar a migração pelo workflow Selletive Database Verification,
executar pgTAP e testes de navegador em banco descartável e somente depois
aplicar a migração no projeto Selletive. O workflow de preview verifica o
Worker publicado com dados reais, sem inserir empresas fictícias.

## Handoff para unificação

- Funcional: `codex/selletive-marketplace-complete`; design: `codex/sortlist-ui`.
  O design partiu de `cd6e165d` da branch funcional. A simulação de merge
  com as correções de formulário até `bf419404` não encontrou conflitos.
- Manter a branch de design intacta até a integração. Preservar seus ajustes
  de navegação, cards, dashboard, selo visual e seletores de teste.
- Rodar `Selletive Database Verification` com `application=true` no
  resultado unificado. O teste usa apenas uma base descartável da CI.
- A migração `20261112234117_marketplace.sql` ainda não foi aplicada no
  projeto conectado. A primeira tentativa foi rejeitada pela revisão
  automática enquanto o navegador ainda não havia validado a entrega.
  Não contornar a revisão. Após CI verde, confirmar a autorização para a
  migração se a revisão continuar bloqueando.
- Conferir versão registrada, classificação do catálogo e acesso público
  ao RPC após aplicar a migração. Criar a tag
  `selletive-marketplace-schema-verified-20261112` no commit cujo diretório
  `apps/web/supabase` corresponde ao schema aplicado. Só então publicar no
  branch de deploy e verificar o Worker. O modo application-only mantém os
  segredos existentes e exige igualdade com a tag.
- Checkout real, domínio definitivo e conferência externa do selo não
  fazem parte desta publicação. Não incluir fontes locais não rastreadas.
