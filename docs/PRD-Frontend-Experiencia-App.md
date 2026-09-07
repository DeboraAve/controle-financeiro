# PRD — Frontend "cara de app" (Controle Financeiro)

**Produto:** Controle Financeiro (PWA para personal trainers)
**Autora do PRD:** Claude, a pedido de Débora
**Data:** 04/09/2026
**Status:** Rascunho para avaliação por fases

## 1. Contexto

O app hoje é um React + Vite + TypeScript, empacotado como PWA instalável (manifest, ícones, tema de cor `#d95026`), com Supabase no backend. A navegação já tem um padrão mobile-first correto (tab bar inferior no mobile, side nav no desktop a partir de 900px), mas a experiência visual ainda "cheira a site":

- Boa parte da UI é montada com `style={{...}}` inline direto nos componentes (visto em `App.tsx`, `Auth.tsx`, `Nav.tsx`), em vez de um sistema de componentes consistente. Isso deixa espaçamento, tipografia e cor inconsistentes entre telas.
- Não há transições entre abas/telas — a troca de `Tab` é uma troca seca de componente (`Screen()` em `App.tsx` faz `if/return` puro, sem animação de entrada/saída).
- Estado de carregamento é só o texto "Carregando…" centralizado — sem skeleton, sem shimmer, sem qualquer indicação estrutural do que está para aparecer.
- Modais (`FeriasModal`, `CobrancaModal`, `AlunoFormModal` etc.) são todos o mesmo padrão de modal genérico centralizado — não há bottom sheet (padrão nativo mobile) nem gestos de arrastar para fechar.
- Não existe feedback tátil (Vibration API), nem pull-to-refresh, nem animação de sucesso/erro além do `Toast` textual simples.
- Não há dark mode, apesar do PWA declarar `theme-color` e `apple-mobile-web-app-status-bar-style: black-translucent`.
- Ícones são só quadrados coloridos (`Marker`) — não há uma linguagem de iconografia real.
- O breakpoint responsivo é único (900px), então o intervalo tablet/desktop pequeno provavelmente herda um layout mobile "esticado" em vez de um layout pensado para a tela.

O objetivo deste PRD é fechar essa distância entre "site responsivo" e "aplicativo", em fases avaliáveis independentemente — cada fase entrega valor visível sozinha e pode ser validada com Débora antes de seguir para a próxima.

## 2. Objetivo do produto

Fazer o Controle Financeiro parecer e se comportar como um app nativo instalado: transições fluidas, feedback imediato em cada ação, hierarquia visual clara, componentes consistentes, e adaptação real (não só "encolhida") entre celular, tablet e desktop.

## 3. Fora de escopo (por ora)

- Reescrita de lógica de negócio (cálculos financeiros, RLS, schema do banco) — tratado no PRD de backend.
- Migração de stack (ex.: trocar React por outro framework, ou ir para app nativo/React Native). Isso pode ser uma fase futura *se* o PWA atingir seu teto, mas não está nesta fase.
- Internacionalização (o app é 100% pt-BR e deve continuar assim).

## 4. Fases

Cada fase tem: objetivo, escopo, entregáveis, critério de aceite e uma estimativa de esforço relativa (P/M/G) para ajudar a priorizar.

### Fase 0 — Fundação de design (P)
**Objetivo:** ter uma base sólida antes de tocar em qualquer tela, para não refazer trabalho nas fases seguintes.

**Escopo:**
- Auditoria de todas as cores/espaçamentos/fontes hoje hardcoded inline e consolidação em `design tokens` (CSS custom properties já existem em parte — `var(--color-accent)`, `var(--space-3)` etc. — mapear o que falta).
- Definir escala tipográfica (tamanhos, pesos) e escala de espaçamento formal.
- Escolher e integrar uma biblioteca de ícones real (ex.: Lucide/Phosphor) para substituir os `Marker` quadrados coloridos.
- Definir princípios de movimento: duração e curva padrão de transição (ex.: 200ms ease-out para entrada, 150ms para saída), quando usar spring vs. ease.
- Inventário de componentes reutilizáveis a extrair (Button, Card, Input, Badge, Modal/Sheet, ListRow, EmptyState, Skeleton).

**Entregáveis:** documento/arquivo de tokens (`tokens.css` ou similar), guia de iconografia, guia de movimento (mesmo que informal, em Markdown).

**Critério de aceite:** Débora aprova a paleta de tokens e o conjunto de ícones antes de qualquer refator visual começar.

---

### Fase 1 — Sistema de componentes (M)
**Objetivo:** parar de escrever `style={{}}` inline e ter blocos reutilizáveis que garantem consistência.

**Escopo:**
- Extrair `Button`, `Card` (hoje só existe `BlueprintCard`), `Input`/`Field`, `Badge` (status pago/atrasado/aberto/cobrado hoje provavelmente são texto colorido inline), `ListRow` (o padrão `.aluno-row` já existe em CSS mas não como componente).
- Criar `EmptyState` padrão (hoje telas vazias provavelmente não têm tratamento visual).
- Criar `Skeleton` para listas e cards, substituindo o "Carregando…" genérico.
- Migrar `Auth.tsx`, `Nav.tsx` e os modais mais simples (`FeriasModal`, `InativarModal`, `CobrancaModal`) para usar os novos componentes, como prova de conceito.

**Entregáveis:** pasta `src/components/ui/` com os componentes-base + 3-4 telas já migradas.

**Critério de aceite:** zero `style={{...}}` inline nas telas migradas; mesma funcionalidade, visual mais consistente.

---

### Fase 2 — Navegação e transições (M)
**Objetivo:** a troca de tela deixa de ser um corte seco e passa a ter continuidade, como em app nativo.

**Escopo:**
- Animação de transição entre abas (fade + slide sutil), usando CSS transitions/View Transitions API do navegador (suportada em Chrome/Edge/Safari recentes — boa opção nativa e leve, sem libs extras) ou Framer Motion caso a View Transitions API não cubra todos os casos.
- Estado ativo da tab bar com indicador animado (hoje é só cor estática).
- Modais viram **bottom sheets** no mobile (arrastam de baixo para cima, com gesto de arrastar para fechar) e continuam como modal centralizado no desktop — esse é um dos maiores sinais visuais de "app real" vs. "site".
- Navegação com histórico correto: back do navegador/gesto do celular fecha modal antes de sair da tela (hoje não está claro se há gestão de histórico).

**Entregáveis:** tab bar animada, componente `Sheet` (bottom sheet) substituindo `Modal` no mobile, transições de tela.

**Critério de aceite:** testar em um celular real (instalado como PWA) e comparar a sensação de navegação antes/depois — gesto de arrastar modal funciona, troca de aba não "pisca".

---

### Fase 3 — Micro-interações e feedback (M)
**Objetivo:** cada ação do usuário gera uma resposta imediata e agradável, não só o resultado final.

**Escopo:**
- Feedback tátil (Vibration API) em ações confirmatórias no mobile (marcar pago, registrar sessão).
- Estados de botão: loading inline no próprio botão (spinner substituindo o texto) em vez de travar a tela inteira.
- UI otimista: ao marcar uma sessão como feita ou um pagamento como pago, atualizar a tela imediatamente e reverter silenciosamente se o Supabase falhar (hoje presumivelmente espera round-trip antes de atualizar).
- Pull-to-refresh no mobile nas listas principais (Alunos, Caixa, Agenda).
- Toast redesenhado com ícone de status (sucesso/erro/aviso) e animação de entrada/saída em vez de aparecer/sumir seco.
- Empty states com ilustração leve ou ícone + call-to-action (ex.: "Nenhum aluno ainda → Cadastrar primeiro aluno").

**Entregáveis:** UI otimista nas 3-4 ações mais frequentes, pull-to-refresh, toast novo.

**Critério de aceite:** nenhuma ação comum (marcar sessão, marcar pagamento) trava a tela esperando o servidor.

---

### Fase 4 — Responsividade real (multi-breakpoint) (M)
**Objetivo:** sair do único breakpoint (900px) e ter um layout pensado por faixa de tela, não só "mobile esticado".

**Escopo:**
- Breakpoints intermediários para tablet (ex.: grid de 2 colunas em telas 600–899px para listas de alunos, painel).
- Desktop com aproveitamento real do espaço: hoje `app-content` tem `max-width: 760px` mesmo no desktop — avaliar layouts com colunas (ex.: lista + detalhe lado a lado no desktop, ao estilo Mail/Notion, em vez de navegação em tela cheia como no mobile).
- Revisão de todos os modais/formulários em telas grandes (evitar formulário de 360px de largura "boiando" no meio de uma tela de 1440px sem contexto).
- Dark mode: usar `prefers-color-scheme` e os tokens da Fase 0 para gerar a paleta escura automaticamente, com toggle manual opcional.

**Entregáveis:** layout de 3 faixas (mobile / tablet / desktop) testado em pelo menos Painel, Alunos e AlunoDetalhe; dark mode funcional.

**Critério de aceite:** app usável e visualmente equilibrado em 375px, 768px e 1440px de largura; dark mode sem contraste quebrado.

---

### Fase 5 — Polimento PWA / "sensação de nativo" (P/M)
**Objetivo:** os últimos detalhes que fazem a diferença entre "site instalável" e "aplicativo".

**Escopo:**
- Splash screen customizada por dispositivo (iOS exige splash screens estáticas por resolução — hoje só há `apple-touch-icon`).
- Revisão dos ícones adaptativos (maskable icon já existe — validar em diferentes formas de launcher Android).
- Status bar / safe area: já há `viewport-fit=cover` e `env(safe-area-inset-bottom)` no CSS da tab bar — estender esse cuidado para topo (notch) em todas as telas, não só a tab bar.
- Feedback de instalação (prompt customizado de "Adicionar à tela inicial" em vez de depender só do prompt nativo do navegador).
- Estado offline: hoje o Workbox está configurado (`vite-plugin-pwa`) só para cache de assets estáticos — avaliar uma tela/estado dedicado para "sem conexão" com dados em cache, já que o app depende de Supabase online para tudo.

**Entregáveis:** splash screens, prompt de instalação customizado, tela de estado offline.

**Critério de aceite:** instalar em iOS e Android e comparar com apps de referência (o objetivo é "não dá pra distinguir de um app nativo só de olhar").

---

### Fase 6 — QA, performance e acessibilidade (P)
**Objetivo:** garantir que o polimento visual não custou performance nem acessibilidade, e travar isso via checklist repetível.

**Escopo:**
- Auditoria Lighthouse (Performance, PWA, Acessibilidade) antes/depois de cada fase anterior, com metas mínimas definidas (ex.: Performance ≥ 90, PWA 100).
- Revisão de contraste de cor (WCAG AA) em ambos os temas (claro/escuro).
- Navegação por teclado nos formulários e modais (tab order, foco visível, `Escape` fecha modal).
- Teste em pelo menos 3 dispositivos reais (Android médio, iPhone, desktop).

**Entregáveis:** relatório Lighthouse, checklist de acessibilidade preenchido.

**Critério de aceite:** metas de performance/PWA atingidas, sem regressão nas telas já migradas.

## 5. Ordem recomendada e independência das fases

As fases 0 e 1 são pré-requisito para todas as demais (sem tokens e componentes consistentes, cada fase seguinte reintroduziria inconsistência). A partir da fase 2, a ordem sugerida (2 → 3 → 4 → 5) é a que dá o ganho perceptível mais rápido primeiro (navegação e feedback são o que mais "grita site" hoje), mas 4 (responsividade) e 5 (polimento PWA) podem trocar de ordem sem problema caso o uso real seja majoritariamente mobile.

## 6. Métricas de sucesso do projeto como um todo

- Teste informal com 2-3 personais que usam o app: pedir para descrever a experiência sem saber que é PWA — objetivo é que ninguém identifique como "site".
- Lighthouse PWA score 100, Performance ≥ 90 em mobile.
- Zero uso de `style={{...}}` inline fora de casos dinâmicos genuínos (cor calculada em runtime, por exemplo).
