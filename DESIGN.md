---
name: Selletive Design System
version: 1.0.0
status: specification
language: pt-BR
theme: light
reference: Workable — análise DESIGN.md fornecida pelo usuário
scope: Descoberta e comparação de fornecedores B2B
---

# Selletive Design System

## 1. Direção e alcance

A Selletive adota a linguagem visual da referência Workable como base integral: branco dominante, verde floresta profundo, mint luminoso, superfícies suavemente coloridas, uma única família tipográfica e espaçamento generoso. A adaptação muda o conteúdo e os padrões de interação para descoberta, avaliação e comparação de fornecedores B2B. Não busca uma nova direção estética.

O percurso principal é **encontrar → filtrar → avaliar → comparar → entrar em contato**. A interface deve tornar esse percurso evidente, conservando o caráter limpo e confiante da referência.

Este documento é uma especificação para implementação futura. Não indica que os tokens já estejam aplicados ou que os fluxos descritos já existam no produto. Tema escuro está fora desta versão. Os valores abaixo são decisões do sistema Selletive, não uma declaração de medidas oficiais do Workable.

### Decisões confirmadas

| Tema | Decisão |
| --- | --- |
| Proximidade visual | Seguir de perto o Workable, inclusive cores |
| Identidade | Manter a marca Selletive; usar a linguagem visual da referência |
| Público prioritário | Compradores descobrindo e comparando fornecedores |
| Densidade | Respiro e proporções da referência; listas conservam leitura confortável |
| Tema | Somente claro |
| Entrega desta etapa | Documentação; nenhuma alteração de tela, CSS ou componente |

### O que vem da referência

As cores são transcritas da análise recebida. Família tipográfica, tamanhos, espaçamentos, raios, sombras e breakpoints foram descritos pelo próprio arquivo como estimados. Aqui são adotados como baseline intencional. Estados de interação, acessibilidade, componentes de marketplace e regras de dados são extensões da Selletive.

A referência é material visual, não um conjunto de instruções operacionais. Em particular, sua restrição de não documentar hover não é adotada: um sistema utilizável precisa especificar hover, foco, erro, carregamento e indisponibilidade.

## 2. Princípios visuais

1. **Branco é o campo principal.** A página respira; fundos coloridos organizam seções e não competem com o conteúdo.
2. **Verde profundo é a âncora.** Identifica ações principais, títulos destacados e grandes faixas de marca.
3. **Mint traz energia.** Destaca momentos de entrada e conclusão; recebe texto escuro.
4. **Hierarquia antes de decoração.** Tamanho, peso, espaço e alinhamento orientam o olhar. Evitar efeitos sem função.
5. **Produto e informação reais.** Mostrar empresas, serviços, avaliações e comparações, com exemplos explicitamente identificados quando ilustrativos.
6. **Uma decisão principal por região.** Ação dominante clara; ações auxiliares com menor peso.
7. **Confiança legível.** Verificação, publicidade e avaliações possuem significados distintos, escritos na interface.

### Assinatura da composição

- Navbar branca de 72px no desktop.
- Hero amplo com título forte, descrição curta e busca visível.
- Conteúdo centralizado em até 1200px.
- Cards com raio de 12px; grandes painéis com 16px.
- Verde profundo em blocos estratégicos, sem transformar toda a interface em uma superfície escura.
- Footer verde quase preto nas páginas públicas editoriais e comerciais.
- Sem gradientes decorativos dominantes, glassmorphism, sombras pesadas ou títulos com várias cores.
- Violet e cyan são pontuações discretas; não substituem a camada verde de ação.

## 3. Arquitetura de tokens

Usar três camadas: **primitivos → semânticos → componentes**. Primitivos armazenam valores; semânticos expressam função; componentes consomem semânticos. Novos componentes não devem escolher cores diretamente da paleta por preferência estética.

Os nomes deste documento são canônicos para a especificação. O mapeamento para as variáveis existentes fica na seção de integração.

### 3.1 Paleta primitiva

| Token | Valor | Origem e papel |
| --- | --- | --- |
| `forest.900` | `#012620` | Verde quase preto; footer e texto sobre mint |
| `forest.800` | `#004038` | Verde principal Workable |
| `forest.700` | `#00544C` | Variante mais clara para interação |
| `teal.800` | `#00665B` | Verde intermediário profundo |
| `teal.700` | `#00756A` | Links e detalhes funcionais |
| `green.700` | `#009E6A` | Verde de apoio |
| `green.600` | `#18A369` | Verde intermediário |
| `green.500` | `#1FBC88` | Acento mint de ação |
| `mint.300` | `#7EDCAF` | Preenchimentos suaves e ilustração |
| `mint.50` | `#F6FEFB` | Superfície mint quase branca |
| `cyan.400` | `#00F5DC` | Acento pontual |
| `blue.100` | `#DFE6F1` | Superfície editorial azul suave |
| `blue.200` | `#C4CFDE` | Divisões e preenchimentos de apoio |
| `violet.600` | `#8736DC` | Etiquetas especiais e categorias |
| `neutral.950` | `#0F161E` | Títulos e texto principal |
| `neutral.800` | `#333E49` | Ícones e texto secundário forte |
| `neutral.700` | `#3D3E45` | Corpo de texto |
| `neutral.500` | `#6F7073` | Texto auxiliar sobre branco |
| `white` | `#FFFFFF` | Canvas e texto invertido |
| `red.600` | `#D5351A` | Erro da referência; ícones e bordas |

Primitivos adicionais da Selletive: `neutral.50 = #F7F9F8`, `neutral.100 = #EEF2F0`, `neutral.200 = #DCE5E1`, `neutral.400 = #7B8983`, `forest.950 = #00332D`, `green.550 = #1AAF7E`, `green.650 = #15976D`, `red.700 = #B42318`, `red.50 = #FFF1EF`, `amber.800 = #854D0E`, `amber.50 = #FFF8E6`, `info.800 = #175A74`, `info.50 = #EDF7FC`, `success.800 = #00665B`, `success.50 = #EAF8F1`, `violet.50 = #F4ECFC`.

Essas adições completam estados e legibilidade. Não são cores medidas no Workable.

### 3.2 Tokens semânticos

| Token | Valor ou referência | Uso |
| --- | --- | --- |
| `surface.canvas` | `white` | Fundo padrão |
| `surface.subtle` | `neutral.50` | Áreas utilitárias discretas |
| `surface.card` | `white` | Empresas, avaliações, popovers |
| `surface.brand-soft` | `mint.50` | Categorias e faixas leves |
| `surface.editorial` | `blue.100` | Blocos editoriais alternados |
| `surface.brand` | `forest.800` | Hero invertido e CTA final |
| `surface.footer` | `forest.900` | Rodapé público |
| `text.primary` | `neutral.950` | Títulos, valores e nomes |
| `text.body` | `neutral.700` | Parágrafos |
| `text.secondary` | `neutral.800` | Metadados relevantes |
| `text.muted` | `neutral.500` | Ajuda sobre branco |
| `text.inverse` | `white` | Fundos verdes profundos |
| `text.on-accent` | `forest.900` | Fundos mint luminosos |
| `text.link` | `teal.700` | Links em superfícies claras |
| `text.link-inverse` | `mint.300` | Links sobre forest |
| `action.primary` | `forest.800` | CTA principal |
| `action.primary-hover` | `forest.700` | Hover principal |
| `action.primary-pressed` | `forest.950` | Pressionado |
| `action.accent` | `green.500` | CTA de destaque em bandas |
| `action.accent-hover` | `green.550` | Hover mint |
| `action.accent-pressed` | `green.650` | Pressionado mint |
| `border.subtle` | `neutral.200` | Cards e divisões |
| `border.control` | `neutral.400` | Controles cujo contorno identifica a interação |
| `border.strong` | `teal.700` | Seleção e controles ativos |
| `focus.ring` | `teal.700` | Foco sobre superfícies claras |
| `focus.ring-inverse` | `mint.300` | Foco sobre verde profundo |
| `state.disabled-bg` | `neutral.100` | Controle indisponível |
| `state.disabled-text` | `neutral.500` | Texto indisponível |

### 3.3 Semântica de feedback

| Estado | Texto / ícone | Fundo | Exemplo |
| --- | --- | --- | --- |
| Sucesso | `success.800` | `success.50` | “Empresa adicionada à comparação” |
| Informação | `info.800` | `info.50` | “Os dados foram informados pela empresa” |
| Atenção | `amber.800` | `amber.50` | “Algumas informações estão incompletas” |
| Erro | `red.700` | `red.50` | “Não foi possível enviar sua solicitação” |
| Especial | `violet.600` | `violet.50` | “Novo recurso” |

O verde da marca não significa automaticamente sucesso. Toda mensagem de estado contém texto e, quando útil, ícone. Não depender apenas de cor.

### 3.4 Contraste e pares permitidos

- Branco sobre `forest.800` para ações e blocos invertidos.
- `forest.900` sobre `green.500` para botões mint; nunca branco nesses botões.
- `text.primary` e `text.body` sobre branco, mint suave e azul suave.
- `text.muted` é destinado a branco; sobre outras superfícies preferir `text.secondary` até validar contraste.
- Usar `red.700` para pequenas mensagens de erro; `red.600` permanece disponível para ícones e bordas.
- Cyan e mint claro são preenchimentos e destaques; não usar como texto corrido sobre branco.
- No estado pressionado do botão mint, conservar o texto escuro e validar a combinação antes de publicar.
- Meta de implementação: contraste mínimo de 4,5:1 em texto normal, 3:1 em texto grande e elementos visuais essenciais de controles. Os pares e estados finais devem ser medidos; esta especificação não representa uma auditoria de conformidade concluída.

## 4. Tipografia

**Família única:** `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`. Inter é a substituta indicada pela referência, não uma fonte oficial do Workable confirmada. Evitar fonte adicional de display. Usar pesos reais 400, 500, 600 e 700.

| Token | Desktop | Mobile | Peso | Entrelinha | Tracking |
| --- | --- | --- | --- | --- | --- |
| `type.display-xl` | 56px | 36px | 700 | 1.10 | -1px / -0.5px |
| `type.display-lg` | 40px | 30px | 700 | 1.15 | -0.5px |
| `type.display-md` | 32px | 26px | 600 | 1.20 | -0.3px |
| `type.title-lg` | 24px | 22px | 600 | 1.30 | 0 |
| `type.title-md` | 18px | 18px | 600 | 1.40 | 0 |
| `type.body-md` | 16px | 16px | 400 | 1.50 | 0 |
| `type.body-sm` | 14px | 14px | 400 | 1.50 | 0 |
| `type.caption` | 13px | 13px | 500 | 1.40 | 0 |
| `type.button` | 15px | 15px | 600 | 1.20 | 0 |
| `type.nav` | 15px | 15px | 500 | 1.40 | 0 |

A entrelinha dos botões foi ampliada em relação à estimativa da referência para acomodar acentos e múltiplas plataformas.

### Uso e composição

- Hero: `display-xl`, largura máxima de 760px, aproximadamente 2–3 linhas.
- Seção: `display-lg`; título de página interna pode usar `display-md`.
- Nome de empresa no resultado: `title-md`; no perfil: `display-md`.
- Descrição introdutória: 16px; até 65 caracteres por linha como objetivo de leitura.
- Listas de atributos: 14px, entrelinha 21px; evitar metadados em 11–12px.
- Valores comparáveis e contagens usam números tabulares quando disponível.
- Hierarquia semântica de headings acompanha a estrutura do conteúdo; tamanho visual não determina a tag HTML.
- Não usar caixa alta em parágrafos, títulos ou CTAs. Siglas e pequenos identificadores são exceções.
- Permitir quebra em nomes e traduções longos. Clamp é aceitável em resumo de card, nunca em preço, status ou informação essencial sem acesso ao conteúdo completo.

## 5. Espaçamento, geometria e layout

### 5.1 Escala

Base de 4px: `space.1 = 4`, `space.2 = 8`, `space.3 = 12`, `space.4 = 16`, `space.5 = 20`, `space.6 = 24`, `space.8 = 32`, `space.10 = 40`, `space.12 = 48`, `space.16 = 64`, `space.20 = 80`, `space.24 = 96`.

| Relação | Valor |
| --- | --- |
| Ícone + label | 8px |
| Label + campo | 8px |
| Campo + ajuda | 8px |
| Campos de um formulário | 24px |
| Título + texto | 12–16px |
| Blocos dentro do card | 16–24px |
| Padding de card editorial | 32px desktop; 24px mobile |
| Padding de card de resultado | 24px desktop; 20px mobile |
| Espaço entre cards | 24px |
| Seções públicas | 80px desktop; 48px mobile |
| Margem do conteúdo para header | 48px desktop; 32px mobile |

### 5.2 Containers e grids

- Container principal: `max-width: 1200px`, centralizado.
- Gutter externo: 16px mobile, 24px tablet, 32px desktop.
- Texto editorial longo: largura máxima 720px.
- Grid editorial: 3 colunas desktop, 2 tablet, 1 mobile; gap 24px.
- Resultados: filtros de 264px + gap de 32px + coluna fluida, a partir de 1024px.
- Perfil: coluna principal flexível + resumo de contato de 320px + gap de 32px no desktop; uma coluna abaixo de 1024px.
- O container pode ocupar a largura disponível até o limite. Nunca comprimir texto para manter um número fixo de colunas.
- Busca e listagens também preservam o respiro Workable: não converter os resultados em uma grade compacta de administração.

### 5.3 Breakpoints

| Faixa | Largura | Comportamento |
| --- | --- | --- |
| Mobile | < 768px | Coluna única, menu em sheet, filtros em drawer |
| Tablet | 768–1023px | Grids editoriais em duas colunas; filtros recolhidos |
| Desktop | 1024–1439px | Navegação completa, filtros laterais, grids em três colunas |
| Wide | ≥ 1440px | Mesmo layout; cresce apenas a margem externa |

Em 320px, conteúdo e ações continuam utilizáveis. A única rolagem horizontal intencional é a região identificada de comparação, quando necessária.

### 5.4 Raios, bordas e profundidade

| Token | Valor | Uso |
| --- | --- | --- |
| `radius.sm` | 6px | Itens de menus e elementos pequenos |
| `radius.md` | 8px | Botões e campos |
| `radius.lg` | 12px | Cards de empresas e planos |
| `radius.xl` | 16px | Painéis grandes e mockups |
| `radius.pill` | 9999px | Badges e chips |
| `radius.full` | 50% | Avatares pessoais |

Bordas padrão de 1px. A seleção pode usar borda interna de 2px, sem mudar a dimensão do componente. Logos de empresas usam contêiner quadrado de raio 8px, não máscara circular obrigatória.

| Elevação | Valor proposto | Uso |
| --- | --- | --- |
| `shadow.none` | `none` | Cards comuns e seções |
| `shadow.sm` | `0 2px 8px rgb(1 38 32 / 0.06)` | Mockup e cartão de destaque |
| `shadow.md` | `0 8px 24px rgb(1 38 32 / 0.10)` | Menu, popover e barra flutuante |
| `shadow.lg` | `0 16px 48px rgb(1 38 32 / 0.16)` | Dialog e drawer |

Camadas propostas: base 0, sticky 20, dropdown 40, overlay 50, dialog 60, toast 70. Tooltips em dialogs devem pertencer à camada do dialog. Usar o mecanismo de camadas da biblioteca para evitar sobreposição incorreta.

## 6. Ícones, imagens e marca

- Usar a biblioteca de ícones já adotada pelo projeto, com estilo outline consistente.
- Tamanhos: 16px em metadados, 20px em controles, 24px em recursos e categorias; traço próximo de 1,75–2px.
- Ícone funcional acompanha texto quando o significado não for óbvio. Botão somente com ícone exige nome acessível.
- Logos de empresas em 48 ou 64px, `object-fit: contain`, sobre branco, com padding interno. Não recolorir logos de terceiros.
- Avatar pessoal circular em 32, 40 ou 48px. Ausência de foto usa iniciais ou símbolo neutro, sem aparência de falha.
- Covers e portfólios conservam proporção, com corte deliberado. Evitar alturas variáveis quebrando grids.
- Imagens editoriais priorizam capturas reais do produto e contextos de trabalho relevantes. Evitar fotografias genéricas em todos os cards.
- Não incorporar wordmark, textos comerciais ou capturas do Workable como identidade da Selletive.
- Logo da Selletive em versão verde sobre branco e branca sobre forest. Preservar proporção e área livre mínima equivalente à altura de uma letra do wordmark.

## 7. Interação e movimento

### Estados obrigatórios

Cada controle interativo especifica default, hover, focus-visible, pressed/selected, disabled e loading quando aplicável. Campos acrescentam read-only, invalid e preenchido. Cards informativos não recebem affordance de botão sem ação correspondente.

- Foco: anel de 2px, offset de 2px; no fundo escuro usar o token invertido.
- Hover: alteração sutil de fundo, borda ou sublinhado; não mover a página nem ampliar o card.
- Pressionado: alteração de preenchimento; sem salto de posição.
- Disabled: preenchimento e texto específicos, sem ação; explicar o motivo quando o usuário precisar resolvê-lo.
- Loading: preservar largura do botão, mostrar spinner e label contextual; impedir submissão duplicada.
- Seleção: ícone ou check + label/estado programático + diferença visual.

### Tempos

`motion.fast = 120ms`, `motion.base = 180ms`, `motion.slow = 240ms`; curva padrão `cubic-bezier(0.2, 0, 0, 1)`. Usar em cor, borda, opacidade e entrada discreta de overlays. Não usar animações constantes para chamar atenção a planos ou publicidade.

Respeitar `prefers-reduced-motion`: remover deslocamentos, desativar shimmer e evitar smooth scroll. Mudanças de conteúdo devem continuar compreensíveis sem animação.

## 8. Componentes fundamentais

### 8.1 Botões

| Variante | Fundo / texto | Uso |
| --- | --- | --- |
| Primary | Forest / branco | Buscar, ver fornecedores, enviar solicitação |
| Accent | Mint vivo / verde quase preto | CTA de entrada e CTA sobre faixa escura |
| Secondary | Branco / forest, borda control | Ação alternativa |
| Ghost | Transparente / forest | Ação auxiliar em toolbar ou card |
| Destructive | `red.700` / branco | Confirmação de exclusão |
| Link | Transparente / teal, sublinhado contextual | Navegação textual |

Tamanhos: `sm = 36px`, `md = 44px`, `lg = 48px`; padding horizontal 16, 20 e 24px; gap 8px; raio 8px. O tamanho lg reproduz o CTA de 48px da referência e é o padrão público. Área acionável mínima de 44×44px para controles de toque, ampliada sem reduzir espaçamento entre alvos quando o visual for menor.

Labels com verbo: “Buscar empresas”, “Comparar empresas”, “Enviar solicitação”. Evitar “Clique aqui”. Uma região não deve exibir dois botões accent competindo entre si. Botões navegam apenas quando implementados como links semânticos; ações usam botão.

### 8.2 Links

Texto teal sobre branco, sublinhado em texto corrido; hover mantém sublinhado e escurece para forest. Links em navegação podem usar sublinhado apenas em hover e foco. Não usar cor como único sinal de link dentro de parágrafos. Destino externo sinalizado quando relevante; nova aba somente quando o fluxo justificar.

### 8.3 Campos

Altura padrão de 48px, padding horizontal de 16px, fonte de 16px, raio 8px, fundo branco, borda `border.control`. Label acima, peso 500, tamanho 14px. Placeholder exemplifica formato, não substitui label.

- Focus-visible: anel teal; borda ativa teal.
- Invalid: borda e mensagem em `red.700`, ícone opcional, associação programática com a ajuda.
- Read-only: conteúdo copiável, indicação clara quando necessária.
- Textarea: mínimo de 120px e redimensionamento vertical.
- Obrigatoriedade explicada no início e nos labels; não depender apenas de asterisco.
- Mensagem de erro explica a correção: “Informe um e-mail válido”.
- Não sinalizar erro antes de o usuário ter oportunidade de preencher o campo.

Selects seguem a mesma altura. Combobox é preferível para categorias e localidades extensas; informa ausência de opções e permite teclado. Checkbox visual de 20px com label e alvo de toque ampliado. Radio para escolha exclusiva; switch somente para alteração binária de efeito imediato.

### 8.4 Cards

Card padrão: branco, borda sutil, raio 12px, padding 24px, sem sombra. Card editorial: fundo mint suave ou azul suave, padding 32px, borda opcional. Card selecionado: borda forest e check explícito. Nunca aplicar hover de card clicável a um agrupamento puramente informativo.

Se o card contém várias ações, usar links explícitos no título e CTAs; não envolver todo o card em um link com botões dentro.

### 8.5 Badges e chips

Badge: 13px/500, padding 4px 12px, raio pill; label curta. Mint suave + forest é a opção padrão. Violet é reservado a recursos especiais, sem significar verificação.

Chip de filtro: altura mínima visual de 32px, label 14px e ação de remover com nome acessível específico, como “Remover filtro São Paulo”. Área de toque ampliada. Chip selecionado usa fundo mint e borda teal.

### 8.6 Tabs, breadcrumbs e paginação

Tabs usam texto de 15px, área de 44px e marcador inferior forest de 2px. Seleção não depende só de cor. Diferenciar tabs que alternam painéis de links de navegação entre páginas.

Breadcrumbs em 14px, separadores discretos, item atual não clicável. No mobile, reduzir ancestrais sem ocultar o contexto essencial.

Paginação com página atual preenchida em forest, labels “Anterior” e “Próxima”, alvos de 44px e contagem visível. Evitar infinite scroll como padrão de diretório: usuários devem conseguir retornar ao mesmo conjunto de resultados.

### 8.7 Menus, tooltips e popovers

Menu branco, borda sutil, raio 8px, sombra md e itens de ao menos 40px visuais com área de toque apropriada. Seleção por teclado, Escape fecha e foco retorna ao acionador.

Tooltip informa detalhes breves, aparece também no foco e não contém informação indispensável disponível apenas por hover. Conteúdo acionável pertence a popover ou dialog. Popover precisa caber na viewport e ter comportamento de foco adequado à sua função.

### 8.8 Dialogs e drawers

Dialog de confirmação: largura máxima 480px; formulário: até 640px; padding 32px desktop e 24px mobile; raio 16px. Overlay `rgb(1 38 32 / 0.40)`. Título, descrição e ações explícitos. Evitar exclusão como ação visual padrão.

Drawer mobile de filtros usa até a altura disponível, cabeçalho fixo, conteúdo rolável e rodapé com “Limpar” e “Ver resultados”. Preservar filtros em edição até aplicar ou descartar. Foco contido quando modal, Escape disponível e retorno ao acionador. Nenhum overlay deixa ações essenciais atrás do teclado virtual.

### 8.9 Feedback

Alert inline para erro que exige correção; toast para confirmação breve; banner para condição persistente da página. Sucesso não deve existir apenas em um toast temporário quando mudar uma informação importante.

Skeleton reproduz estrutura e reserva espaço, sem dados falsos. Spinner para ações curtas de escopo definido. Erro de carregamento inclui “Tentar novamente” e preserva filtros e valores já preenchidos.

## 9. Componentes de descoberta e comparação

### 9.1 Navegação pública

Desktop: 72px de altura, fundo branco, container 1200px. Wordmark à esquerda; “Explorar empresas” e categorias no centro; “Entrar” e ação para empresas à direita. O CTA para fornecedores deve ter menor protagonismo que a busca no hero.

Mobile: 64px, logo e botão de menu de 44px. Menu em sheet, sem barra horizontal de links comprimida. Navbar sticky pode usar borda inferior discreta; não adicionar sombra forte permanente.

### 9.2 Busca principal

Composição: campo “O que sua empresa precisa?” + localidade opcional + botão “Buscar empresas”. Grupo branco com borda control, raio 12px e sombra sm apenas quando destacado no hero. Controles com 48px ou mais de altura; grupo com padding 8px e gap 8px.

Desktop: campos lado a lado; campo de necessidade flexível, localidade entre 200–240px. Mobile: empilhados e botão na largura disponível. Labels visíveis ou acessíveis conforme o contexto, sem depender exclusivamente de placeholders.

Sugestões agrupadas em categorias, serviços e empresas, com nome, tipo e destaque textual discreto da correspondência. Teclado com setas, Enter e Escape; estados “Buscando sugestões” e “Nenhuma sugestão”. Submeter a busca deve funcionar sem selecionar uma sugestão.

### 9.3 Categorias

Card editorial mint ou azul, ícone de 24px, título de 18px, descrição de até duas linhas e link explícito. Padding 32px e raio 12px. Quantidade de empresas somente quando houver dado confiável. Não alternar cor mecanicamente em cada resultado; alternância é recurso de composição editorial por grupo ou seção.

### 9.4 Cabeçalho de resultados

Breadcrumb → título → descrição curta → contagem e ordenação. Exemplo de título: “Agências de marketing em São Paulo”. Não exibir “melhores” como conclusão sem método editorial correspondente.

Toolbar: quantidade à esquerda, ordenação à direita. Mobile: “Filtrar” com quantidade de filtros ativos e controle de ordenação. A contagem acompanha os filtros aplicados; durante recarga, não mostrar número antigo como resultado confirmado.

### 9.5 Filtros

Grupos previstos: categoria, localização, atendimento remoto e outros atributos realmente disponíveis no produto. Orçamento, tamanho de equipe e avaliação só aparecem quando dados e consultas os suportarem.

Sidebar desktop de 264px; títulos de 14px/600, opções com gap de 12px, grupos separados por 24px. Preferir checkbox para múltipla escolha e radio para escolha exclusiva. Filtros ativos aparecem como chips acima dos resultados, com “Limpar filtros”.

Persistir filtros na URL quando implementados, para compartilhar e voltar à busca. Aplicação automática no desktop precisa indicar atualização e evitar perda de foco. No drawer mobile, aplicar explicitamente. Não prometer quantidade de resultados antes da consulta concluir.

### 9.6 Card de empresa

**Estrutura padrão, nesta ordem:**

1. Logo 64×64px; nome em 18px/600 com link; status relevante ao lado ou abaixo.
2. Categoria e localização em 14px.
3. Avaliação e número de avaliações, quando existentes.
4. Resumo em 14–16px, até três linhas com acesso ao perfil completo.
5. Até três atributos úteis e comparáveis, como serviços, porte e atendimento remoto.
6. Ações “Ver empresa” e “Adicionar à comparação”.

Card branco, raio 12px, padding 24px, borda sutil, gap de 24px entre resultados. Desktop organiza identidade e conteúdo em linha; ações podem ocupar coluna lateral se houver largura. Mobile empilha conteúdo e ações sem encurtar o nome da empresa.

Campo ausente aparece como “Não informado” quando for relevante à decisão, ou é omitido quando secundário. Não transformar ausência de preço em “Grátis” ou ausência de avaliações em nota zero.

### 9.7 Confiança, verificação e promoção

| Conceito | Apresentação | Regra |
| --- | --- | --- |
| Perfil reivindicado | Informação neutra, quando necessária | Não equivale a qualidade comprovada |
| Verificação | Badge mint + ícone + “Verificada” | Explicar o que foi verificado segundo o mecanismo real |
| Promoção paga | Label “Patrocinado” visível | Separado de verificação e nota |
| Destaque comercial | Borda ou superfície suave | Não implica recomendação editorial |
| Avaliação de usuários | Nota + quantidade + acesso às avaliações | Exibir dados reais e contexto |

Não usar escudo ou selo verde para sugerir auditoria que o produto não realizou. O texto de ajuda da verificação deve refletir o processo vigente. “Highlight” e “Spotlight” são nomes comerciais de planos, não estados de confiança.

### 9.8 Avaliações

Resumo com nota numérica, escala explícita e quantidade: “4,8 de 5 · 24 avaliações”, apenas como exemplo de formato. Ícones de estrela em forest; versão resumida pode usar uma estrela seguida de nota e contagem. Leitor de tela recebe a informação completa sem repetição de cada estrela.

Card de avaliação: nome e contexto permitido do autor, data, nota, título opcional e texto. Indicar incentivos ou vínculos quando aplicável e conhecido. Estado sem avaliações: “Esta empresa ainda não recebeu avaliações”. Nunca fabricar depoimentos para preencher layout.

### 9.9 Barra de comparação

Especificação inicial: comparar de 2 a 4 empresas; limite é decisão proposta de interface, sujeito ao suporte real do produto. Antes de implementar, confirmar que o fluxo e os dados suportam essa quantidade.

Barra sticky inferior branca, borda sutil, sombra md; miniaturas, quantidade selecionada, “Limpar” e CTA “Comparar empresas”. Seleção de uma empresa mantém a barra e explica que é preciso adicionar mais uma. Ao atingir o limite, explicar como substituir uma empresa.

Reservar espaço inferior equivalente à barra e à safe area para não cobrir conteúdo, paginação ou foco. No mobile, resumir miniaturas, manter contagem e ação; remoção continua disponível. Adição e remoção são anunciadas de forma discreta a leitores de tela.

### 9.10 Tabela de comparação

Colunas por empresa; linhas por atributo. Cabeçalho com logo, nome, verificação e link para perfil. Grupos: visão geral, serviços, localização/atendimento, porte, avaliações e contato, conforme disponibilidade real.

Padding de célula 16–24px, texto 14px, cabeçalhos em 14px/600, divisores sutis. Realçar diferença relevante com fundo mint suave e texto explicativo, não apenas cor. “Não informado” é diferente de “Não oferece”.

Mobile: região de rolagem horizontal identificada e acessível por teclado, com indicador de continuidade; preservar contexto dos atributos. Não reduzir toda a tabela até texto ficar ilegível. Cabeçalhos associados às células; fixação de primeira coluna só se não bloquear as demais na largura mínima.

### 9.11 Perfil da empresa

Hero branco: logo, nome, categoria, localidade, verificação, avaliação e ações. Separação entre blocos por espaço e bordas leves. Cover opcional não desloca o conteúdo principal para muito abaixo da dobra.

Seções: visão geral, serviços, portfólio quando existente, avaliações e informações da empresa. Navegação por âncoras ou tabs conforme a natureza real do conteúdo. Coluna de contato em card branco ou mint suave; CTA principal “Entrar em contato” quando disponível.

Resumo sticky no desktop respeita a altura da navbar e da viewport. Mobile mostra ação perto do resumo e novamente após conteúdo relevante; evitar uma segunda barra fixa concorrendo com a comparação. Links de contato não devem sugerir envio interno quando abrem um destino externo.

### 9.12 Signals

Signal é um pedido de projeto para encontrar fornecedores. CTA de apoio à descoberta: “Descreva seu projeto”. Apresentar uma explicação curta do que será compartilhado e de quem poderá receber os dados, conforme o comportamento real.

Formulário em etapas apenas quando reduzir complexidade: necessidade → contexto → contato → revisão. Indicador com nome e número da etapa, avanço sem perder campos, erros junto dos inputs e confirmação persistente após envio. Não inventar prazo de resposta, garantia de match ou número de fornecedores.

### 9.13 Planos e aquisição de fornecedores

Uso secundário neste sistema. Grid de 3–4 cards apenas quando comportar a oferta real; duas colunas tablet e uma mobile. Card padrão branco, padding 32px, raio 12px. Plano em destaque usa forest com texto branco e CTA mint, reproduzindo a referência.

Preço, periodicidade, impostos e limitações precisam ser claros. Comparação de planos não mistura promoção paga com qualidade comprovada. Nenhum preço ou benefício deste documento constitui uma oferta comercial aprovada.

## 10. Templates de página

### 10.1 Home de descoberta

1. Navbar branca.
2. Hero branco: título de 56px, introdução de 16px e busca em destaque; padding vertical de 80px.
3. Categorias em grid de três colunas; cards mint e azul suave organizados por grupo.
4. Explicação curta do processo, com produto real ou exemplo identificado.
5. Empresas ou conteúdo editorial com critério de seleção explícito.
6. Faixa forest com CTA mint para descrever um projeto.
7. Footer verde quase preto.

Não adicionar seção apenas para alternar cores. O comprimento da página acompanha a utilidade do conteúdo.

### 10.2 Categoria e resultados

Navbar → breadcrumb e introdução → busca contextual → toolbar → filtros + resultados → paginação → conteúdo editorial útil da categoria → footer. Barra de comparação aparece somente quando há seleção.

### 10.3 Perfil

Navbar → breadcrumb → identidade da empresa → conteúdo principal + contato → empresas relacionadas se houver critério e dados → footer.

### 10.4 Comparação

Navbar → título e contexto da seleção → controles de empresas → tabela agrupada → próximo passo. Superfícies predominantemente brancas; forest reservado às ações, sem transformar a tabela em uma faixa escura.

### 10.5 Estados especiais

| Estado | Conteúdo e ação |
| --- | --- |
| Busca inicial vazia | Orientação e categorias, sem mensagem de erro |
| Nenhum resultado | Repetir o contexto da busca, sugerir remover filtros ou ampliar localidade |
| Erro de consulta | Mensagem clara, tentar novamente, preservar busca |
| Perfil sem descrição | Informar ausência; não gerar conteúdo atribuído à empresa |
| Sem avaliações | Explicar que ainda não há avaliações |
| Página não encontrada | Título direto e acesso à busca |
| Ação exige login | Explicar a necessidade e preservar intenção após autenticação |
| Contato indisponível | Informar indisponibilidade e oferecer voltar à descoberta |

## 11. Conteúdo e linguagem

Português brasileiro como baseline de exemplos; estrutura suporta traduções e expansão de labels. Tom claro, direto e útil. Usar linguagem de descoberta e decisão: empresas, fornecedores, serviços, comparar, avaliações, projeto.

- “Encontrar fornecedores para sua empresa” é preferível a promessa absoluta de encontrar “os melhores”.
- “Patrocinado” é preferível a eufemismos que escondam promoção.
- “Não informado” é preferível a um traço ambíguo em comparações.
- “Adicionar à comparação” alterna para “Remover da comparação” após seleção.
- Datas e valores seguem o locale; exemplo pt-BR: `28 out. 2026`, `R$ 1.500`.
- Mostrar unidade e periodicidade quando houver orçamento ou preço.
- Não confundir cidade da sede com regiões atendidas.
- Exemplos visuais usam empresas fictícias identificadas ou dados reais autorizados, nunca métricas inventadas apresentadas como reais.

## 12. Acessibilidade e responsividade

Estas são condições de aceite da implementação, não uma certificação obtida pelo documento.

- Todas as ações utilizáveis por teclado; ordem de foco acompanha a leitura visual.
- Foco sempre visível e não encoberto por navbar, drawers ou barra de comparação.
- Skip link para o conteúdo principal.
- Landmarks e títulos descrevem a estrutura da página.
- Labels associados a campos; erro e ajuda ligados programaticamente.
- Estados selecionados, expandidos e inválidos expostos à tecnologia assistiva.
- Atualização de resultados anunciada sem reler toda a página ou roubar foco.
- Nenhuma instrução depende apenas de posição, ícone ou cor.
- Controles de toque com alvo de 44px como padrão do produto.
- Zoom de 200% mantém conteúdo e ações; reflow em 320 CSS px sem perda, exceto a região tabular com rolagem prevista.
- Conteúdo suporta textos longos, acentos e nomes de empresas sem truncar informação essencial.
- Imagens informativas com alternativa textual; decorativas com alternativa vazia.
- Overlays têm nome, descrição quando útil, controle de foco e fechamento previsível.
- Sticky headers respeitam offsets de âncoras; mensagens de erro recebem foco ou resumo adequado após envio.
- Movimento reduzido respeitado; nenhuma informação exige animação.

## 13. Integração com o projeto

O projeto já possui componentes `@kit/ui` e variáveis em `apps/web/styles/theme.css`. A implementação futura deve adaptar essa base, evitando uma biblioteca paralela. Esta seção é um mapa de migração, não uma instrução para aplicar mudanças nesta etapa.

### 13.1 Mapeamento de variáveis

| Variável existente | Token proposto |
| --- | --- |
| `--background` | `surface.canvas` |
| `--foreground` | `text.primary` |
| `--card` | `surface.card` |
| `--card-foreground` | `text.primary` |
| `--popover` | `surface.card` |
| `--popover-foreground` | `text.primary` |
| `--primary` | `action.primary` |
| `--primary-foreground` | `text.inverse` |
| `--secondary` | `surface.brand-soft` |
| `--secondary-foreground` | `forest.800` |
| `--muted` | `surface.subtle` |
| `--muted-foreground` | `text.muted` |
| `--accent` | `surface.brand-soft` |
| `--accent-foreground` | `forest.800` |
| `--destructive` | `red.700` |
| `--border` | `border.subtle` |
| `--input` | `border.control` |
| `--ring` | `focus.ring` |
| `--radius` | Baseline de 8px; calibrar escala derivada antes de aplicar |

**Atenção:** `--accent` do kit é uma superfície de interação. Não mapear automaticamente para o mint vivo de CTA. Criar tokens próprios para a variante `button-accent`.

Definir tokens adicionais de hover, pressed, sucesso, warning, informação, gráficos e superfícies editoriais. Para componentes sobre forest, fornecer tokens locais de texto e foco invertidos sem acionar um tema escuro global.

Sidebars de gestão, quando adaptadas futuramente, permanecem claras: fundo branco ou neutral.50, texto ink, seleção mint suave com texto forest, separador sutil. Evitar herdar um sidebar preto do tema anterior.

### 13.2 Uso de componentes

- Reutilizar button, input, select, checkbox, card, badge, dialog, sheet, tabs e table da biblioteca existente conforme os exports disponíveis.
- Criar variantes semânticas explícitas para CTA mint e badge de verificação.
- Encapsular card de empresa, busca e barra de comparação como componentes de domínio.
- Formulários seguem `react-hook-form` e `@kit/ui/form`, conforme as regras do projeto.
- Usar traduções para conteúdo de interface e `data-test` nos pontos adequados para testes E2E.
- Este documento não modifica regras de autorização, dados ou permissões. Um botão oculto nunca substitui controle de acesso.
- Preservar preferência clara em toda a aplicação ao implementar esta versão; não deixar alternador de tema oferecendo um tema não especificado.

### 13.3 Gráficos, quando necessários

Gráficos são secundários na experiência de descoberta. Ordem inicial de séries: teal, forest, violet, azul e mint, com padrões, rótulos ou marcadores adicionais. Não usar somente diferentes verdes para séries que precisam ser distinguidas. Valores legíveis em texto e legenda; cyan apenas em detalhe sobre fundo que assegure visibilidade.

## 14. Exemplos de composição

### Hero

> Encontre o parceiro certo para sua empresa
>
> Explore empresas de marketing, tecnologia e serviços. Compare informações e escolha com mais clareza.
>
> [O que sua empresa precisa?] [Localidade] [Buscar empresas]

Título ink sobre branco; palavra destacada opcional em forest. Busca branca com borda, CTA forest. Abaixo, categorias em links teal. Sem números de prova social sem fonte.

### Resultado ilustrativo

> **Empresa Exemplo** · Verificada
>
> Marketing digital · São Paulo · Atendimento remoto
>
> Estratégia, mídia e conteúdo para empresas B2B.
>
> Avaliações: ainda não disponíveis
>
> [Ver empresa] [Adicionar à comparação]

“Empresa Exemplo” é fictícia. O badge demonstra posição visual; sua presença em produção depende da verificação real. Card branco, informações alinhadas à esquerda, sem fundo forest em toda a listagem.

### CTA final

> Conte o que sua empresa precisa
>
> Descreva seu projeto para iniciar a busca por fornecedores.
>
> [Descrever meu projeto]

Faixa forest, texto branco, botão mint com texto verde quase preto. Padding de 80px desktop e 48px mobile; raio opcional de 16px quando a faixa estiver dentro do container.

## 15. Regras de consistência

| Fazer | Evitar |
| --- | --- |
| Repetir o vocabulário visual Workable | Criar uma direção estética diferente por página |
| Manter branco dominante e verde como âncora | Usar grandes superfícies violet ou cyan |
| Usar mint com texto escuro | Texto branco sobre mint vivo |
| Alternar faixas editoriais com intenção | Colorir cada linha de resultados alternadamente |
| Reservar sombras para sobreposição e destaque | Shadow em todos os cards |
| Definir hover, foco e loading | Documentar apenas o estado estático |
| Explicar publicidade e verificação | Fazer plano pago parecer selo de qualidade |
| Preservar espaçamento em listas | Apertar tudo para caber mais empresas |
| Mostrar dados reais e ausências claras | Preencher lacunas com nota ou preço fictício |
| Usar o kit existente e variantes semânticas | Introduzir CSS divergente em cada tela |

## 16. Critérios de aceite para aplicação futura

### Fidelidade visual

- Paleta forest, teal e mint da referência preservada.
- Inter e escala tipográfica coerentes entre páginas.
- Navbar, hero, cards e footer respeitam proporções documentadas.
- Respiro de 80px nas seções desktop e cards com raios de 12px.
- Nenhum tema escuro ou direção visual adicional introduzido.

### Experiência de descoberta

- Busca é a ação principal da home.
- Filtros, ordenação e paginação têm estados previsíveis.
- Cards apresentam atributos em ordem consistente.
- Comparação diferencia dado ausente de resposta negativa.
- Verificação, promoção e avaliações são visual e semanticamente distintas.
- Mobile mantém ações e dados essenciais sem densidade excessiva.

### Qualidade

- Contraste medido nos pares reais, inclusive hover, pressed e foco.
- Navegação por teclado, leitores de tela, zoom e movimento reduzido verificados.
- Estados vazio, erro, loading e indisponível cobertos.
- Verificação de telas em 320, 390, 768, 1024 e 1440px, com nomes e textos longos.
- Comparação visual por hierarquia, ritmo, superfície e geometria, não apenas por cor.
- Implementação validada somente em CI na nuvem ou preview remoto, conforme `AGENTS.md`; não iniciar aplicação ou testes locais.

## 17. Origem, limites e evolução

Fonte visual: `DESIGN.md` da análise Workable fornecida pelo usuário, identificado no arquivo como “Documented by Duply”. Não houve inspeção do site ao vivo ou medição independente de sua interface.

A fidelidade desta especificação é à referência recebida. Cores foram preservadas; dimensões estimadas foram adotadas explicitamente; componentes de descoberta, estados e regras de confiança foram ampliados para a Selletive. Este documento não deve ser descrito como o design system oficial do Workable.

A aplicação futura deve começar pelos tokens e componentes básicos, seguir para home e resultados, depois perfil e comparação. Alterações nos valores canônicos devem atualizar este documento junto dos componentes afetados. Um novo token precisa de função e exemplos; um novo componente precisa de estados, responsividade e comportamento acessível.
