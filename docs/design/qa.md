# QA — Fase 6 (Lighthouse, contraste, teclado)

Auditoria feita em 2026-09-07 contra o **build de produção** (`npm run build` + `vite preview`), não o `npm run dev` — dev não é minificado e dá nota de performance artificialmente pior.

## Como isso foi medido (leia antes de confiar nos números)

- **Lighthouse**: rodei de verdade, via a API do Node (`lighthouse` + `chrome-launcher`) contra um Chromium real, não estimei nem copiei de outro projeto. O CLI do Lighthouse trava na hora de limpar o perfil temporário do Chrome nesse ambiente Windows (bug conhecido do `chrome-launcher`, `EPERM` no `rmSync`) — contornei chamando a API direto e capturando o relatório antes da limpeza falhar.
- **Contraste**: calculado com a fórmula de luminância relativa do WCAG, em cima da cor **computada de verdade pelo navegador** (Chromium resolve os `color-mix()` dos tokens e devolve `color(srgb ...)`), não em cima do valor "de olho" no CSS.
- **3 dispositivos reais** (Android médio, iPhone, desktop) — **não tenho hardware físico neste ambiente**. Substituí por emulação (viewport + user-agent do Playwright/Chromium) nas larguras 375/390 (mobile), 768 (tablet) e 1440 (desktop), testadas ao longo das Fases 2-6. É o melhor disponível aqui, mas **não é o mesmo** que testar num Android/iPhone de verdade — recomendo esse passo antes de considerar o PRD encerrado.

## Lighthouse — build de produção, `/impulsa/`

| Categoria | Mobile | Desktop | Meta do PRD |
|---|---|---|---|
| Performance | **91** | **99** | ≥ 90 |
| Accessibility | **100** | **100** | — |
| Best Practices | **100** | **100** | — |
| PWA | não existe mais como categoria numérica nas versões recentes do Lighthouse (removida do core) | — | 100 |

A categoria "PWA" que o PRD cita foi descontinuada pelo próprio Lighthouse — hoje ele cobre isso via auditorias individuais (manifesto, service worker, ícones), não uma nota só. As auditorias que restaram (instalável, ícone maskable, tema) passam — verificado manualmente nas Fases 0 e 5.

### Achados corrigidos nesta rodada

1. **Performance mobile 89 → 91.** A fonte do Google Fonts entrava via `@import` dentro do CSS — isso cria uma cadeia de rede de 4 níveis (HTML → bundle CSS → CSS do Google Fonts → arquivo da fonte), **100% bloqueante**, porque o `@import` só é descoberto depois que o navegador baixa E interpreta o CSS inteiro. Troquei por `<link rel="preconnect">` + `<link rel="stylesheet">` direto no `index.html` (ver [`index.html`](../../index.html)) — os dois primeiros níveis agora saem em paralelo com o CSS principal.
2. **Accessibility mobile 98 → 100.** Dois problemas: `<html lang="en">` num app inteiro em português (agora `lang="pt-BR"`), e nenhum elemento `<main>` na página — nem na tela de Auth (a que a auditoria via, sem sessão) nem no shell pós-login. Os dois corrigidos.

### Code-splitting — feito numa rodada seguinte

"Reduce unused JavaScript" apontava ~72% do bundle principal sem uso no primeiro carregamento (React + todas as telas + todos os modais chegavam juntos, mas só a tela de Auth roda de fato antes do login). Dividido em duas partes:

- **`AuthenticatedApp.tsx`** — tudo que só existe depois do login (`AppContext`, as telas, os 11 modais) virou um chunk carregado sob demanda (`React.lazy`), só depois da sessão confirmar. Quem está na tela de Auth não baixa mais nada disso.
- **As 7 telas** (Painel, Alunos, AlunoDetalhe, Agenda, Caixa, Cobrança, GestãoPersonais) — cada uma virou seu próprio chunk dentro do shell pós-login, carregada só quando visitada.

Os modais ficaram de fora de propósito: eles precisam continuar montados durante a própria animação de saída (Fase 2), então já ficam sempre presentes na árvore — dividir o código deles não economizaria nada, só atrasaria a primeira abertura de cada um.

Resultado: bundle inicial (o que carrega antes do login) caiu de 516 KB pra 420 KB — confirmado com requisições de rede reais, não só o tamanho do arquivo: nenhum chunk de tela ou do shell pós-login chega ao navegador enquanto não há sessão. Performance no Lighthouse ficou estável (91) — o ganho aparece na conexão lenta de quem ainda nem logou, não no score em si, que já estava dominado pelo carregamento da fonte.

**Um bug real apareceu no meio do caminho** (não relacionado ao code-splitting em si, só evidenciado pelo Lighthouse rodando de novo): o `.btn-primary` usava `var(--color-bg)` pra cor do texto — um token que *muda* de tema — sobre `--brand-solid`, que foi feito de propósito pra *não* mudar (é o ajuste da correção do botão, acima). No escuro, isso virava texto cor de tinta sobre o rosa, 3.69:1. Trocado pra `--brand-on`, o token fixo certo — 4.55:1 nos dois temas, confirmado.

## Contraste (WCAG AA — 4.5:1 texto normal, 3:1 texto grande/UI)

Calculado nos dois temas, em cima dos tokens reais (`tokens.css`).

| Par | Claro (antes → depois) | Escuro |
|---|---|---|
| Texto principal / fundo | 16.79:1 ✓ | 16.79:1 ✓ |
| Texto muted / fundo | 4.60:1 ✓ | 6.65:1 ✓ |
| **Status "pago" (menta) / fundo** | **2.89:1 ✗ → 4.61:1 ✓** | 9.47:1 ✓ |
| **Link/accent / fundo** | **4.27 (só grande) → 4.54:1 ✓** | 7.14:1 ✓ |
| **Status "cobrado"/aviso / fundo** | **4.28 (só grande) → 4.61:1 ✓** | 9.73:1 ✓ |
| **Chip "cobrado"/laranja (texto+fundo)** | **4.10 → 4.41 (só texto grande/UI)** | 10.11:1 ✓ |
| Texto desabilitado / fundo | 2.99 → 3.17 (só grande/UI — aceitável, é o papel de "desabilitado") | 4.42 (só grande/UI) |
| **Texto branco no botão rosa (marca)** | **3.19:1 ✗ → 4.55:1 ✓** | **3.19:1 ✗ → 4.55:1 ✓** |

**Quatro ajustes feitos** em `tokens.css`: três nas fórmulas de `color-mix` que são minhas, não valores da marca — o menta usado como texto de "pago" estava claro demais (78% de mistura → 60%), o tom de link/accent e o de aviso/laranja precisavam de um empurrão pequeno (85%→82% e 70%→67%). Recalculei os percentuais mínimos matematicamente em vez de tentar valores no escuro — cada um sobe pro limiar exato do AA sem escurecer mais que o necessário.

**O quarto era uma decisão de marca — resolvido com a Débora, não por conta própria.** O texto branco sobre o botão rosa (`--brand-on` sobre `--brand` puro) media 3.19:1. Apresentei as duas correções possíveis (escurecer só o fundo do botão, ou trocar o texto pra tinta) com uma comparação visual lado a lado antes de mexer em qualquer coisa. Ela escolheu escurecer o fundo. Criado `--brand-solid` (`#D13268`, fixo nos dois temas — o botão não deve trocar de cor junto com claro/escuro) só para essas duas superfícies que preenchem sólido com texto claro em cima (`.btn-primary`, `.seg-opt` marcado); `--brand`/`--color-pink` continuam exatos em todo o resto — logo, ícone ativo do menu, link, eyebrow. 4.55:1 nos dois temas.

## Navegação por teclado

- **Auth**: ordem de tab limpa — e-mail → senha → Entrar → alternar modo. Sem saltos.
- **Modal/Sheet**: achei e corrigi um problema real testando de verdade (não só lendo o código) — **o foco não ficava preso dentro do modal**. Ao abrir, o Tab seguinte ia parar num botão escondido atrás do backdrop, porque a ordem do Tab segue a ordem do DOM, não a visual. Corrigido em [`Modal.tsx`](../../src/components/ui/Modal.tsx):
  - Foco move pro primeiro elemento focável do modal assim que ele abre.
  - Tab/Shift+Tab ciclam só entre os elementos do modal (não escapam pro fundo).
  - Ao fechar (por qualquer via — X, backdrop, Esc, arrastar, voltar do navegador), o foco volta pra quem abriu o modal.
  - Adicionado `role="dialog"`, `aria-modal="true"` e `aria-labelledby` pro título — não tinha nenhuma marcação de diálogo pra leitor de tela antes.
  - Esc fechando já existia (Fase 2) e continua funcionando.
- **`:focus-visible`** já existia globalmente em `industry.css` antes desta fase (inputs, botões, radio, segmented control) — confirmado que o anel aparece em navegação por teclado.

## Resumo do critério de aceite do PRD

| Critério | Status |
|---|---|
| Performance ≥ 90 | ✅ 91 mobile / 99 desktop |
| PWA 100 | Categoria não existe mais no Lighthouse — checagens individuais (manifesto, ícones, service worker) passam |
| Contraste AA nos dois temas | ✅ todos os pares corrigidos, incluindo o botão da marca (decisão da Débora: escurecer só o fundo) |
| Navegação por teclado (tab order, foco visível, Esc fecha modal) | ✅ — achado e corrigido o focus trap que faltava |
| 3 dispositivos reais | ⚠️ substituído por emulação — recomendo validar em hardware real antes de encerrar o PRD |
