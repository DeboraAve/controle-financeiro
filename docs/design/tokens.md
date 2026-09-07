# Tokens de design

Fonte da verdade: [`src/styles/tokens.css`](../../src/styles/tokens.css). Paleta e tipografia seguem a identidade Impulsa (proposta Blue Agency, set/2026 — PDF em [`IMPULSA/`](../../IMPULSA)).

## As duas camadas

**Primitivo** é um valor (`--color-neutral-600` é um cinza específico).
**Semântico** é um papel (`--text-muted` é "a cor de uma legenda").

Telas e componentes usam **só a camada semântica**. O motivo é prático: o dark mode da Fase 4 vai redefinir os semânticos e deixar os primitivos intactos. Toda cor escrita direto numa tela (`color: 'var(--color-neutral-600)'`, como hoje em `Alunos.tsx`) é uma cor que o tema escuro não consegue trocar.

## As cinco cores da marca

`--color-pink` `#FF3D7F` · `--color-orange` `#FF8A3D` · `--color-mint` `#12D6A6` · `--color-ink` `#1B1330` · `--color-off-white` `#FFF7F3`.

Rosa e laranja **nunca mudam entre temas claro/escuro** — são o que ancora a marca em qualquer contexto de status-bar. Só o par fundo/texto inverte no escuro (Fase 4), com `--color-surface-dark` (`#2A2140`) como superfície elevada dos cards.

A rampa `--color-accent-100..900` (rosa) e `--color-accent-2-100..900` (laranja) não veio pronta da agência — é gerada por `color-mix()` a partir da cor de marca (100 = tingido de branco, 600 = a cor exata, 900 = tingido de preto), e o mesmo vale pra rampa neutra (`--color-neutral-100..900`), derivada entre Ink e Off-white. Fórmula única, sem hex escolhido a dedo — qualquer ajuste futuro de tom é uma linha em `tokens.css`, não uma rampa inteira pra recalibrar.

## Cor semântica

| Token | Mapeia para | Uso |
|---|---|---|
| `--surface-base` | Off-white `#FFF7F3` | Fundo da aplicação |
| `--surface-raised` | `#FFFFFF` | Card, input, dialog |
| `--surface-sunken` | `--color-neutral-200` | Poços, trilhos, skeleton |
| `--surface-overlay` | ink a 50% | Backdrop de modal |
| `--text-primary` | Ink `#1B1330` | Corpo e títulos |
| `--text-secondary` | text a 70% | Rótulo de campo |
| `--text-muted` | `--color-neutral-600` | Legenda, metadado, contagem |
| `--text-disabled` | `--color-neutral-500` | Item inativo (avatar, texto) |
| `--text-inverse` | Off-white | Texto sobre fundo escuro ou accent |
| `--text-accent` | `--color-accent-700` (rosa escuro) | Link, botão fantasma |
| `--border-subtle` | text a 8% | Divisor entre linhas de lista |
| `--border-default` | text a 13% | Borda de input, divisor de seção |
| `--border-strong` | text a 45% | Input em hover |
| `--brand` | `--color-accent-600` (Pink) | Botão primário, estado ativo |
| `--brand-hover` / `--brand-active` | accent-700 / -800 | Estados do primário |
| `--brand-bg` | `--color-accent-100` | Fundo suave da marca (avatar, banner) |
| `--brand-on` | Off-white | Texto sobre a marca |

O gradiente rosa→laranja (usado no símbolo e pode ser usado em splash/CTA de destaque) é o "assinado" visual da marca — a agência pede pra reservar ele pra destaques, nunca em bloco grande de texto corrido.

### Status

O kit da Impulsa não define um vermelho de alarme à parte: **rosa também é a cor de cobrança em aberto/atrasada** (é a leitura oficial do brief — "Primária: CTA, destaque, cobrança em aberto"). A própria agência avisa que cor nunca deve ser o único sinal de status — sempre acompanhada de texto/ícone — e é exatamente assim que os componentes (`Badge`, `ListRow`) já funcionam, então não foi preciso inventar um tom novo.

| Token | Valor | Papel |
|---|---|---|
| `--status-danger` / `-bg` | accent-800 / accent-100 (rosa) | Atrasado, exclusão |
| `--status-warning` / `-bg` | accent-2-800 / accent-2-100 (laranja) | Vence hoje, cobrado |
| `--status-ok` / `-bg` | mint-700 / mint-100 | Pago, meta batida, aula confirmada |
| `--status-neutral` / `-bg` | neutral-700 / neutral-100 | Inativo, sem informação |

## Tipografia

Duas famílias, papéis bem separados — não é "título e corpo" genérico, é uma regra explícita da marca:

- **Erica One** (`--font-display`) — traço redondo, peso único. Só para títulos curtos e o logotipo (`h1`/`h2`: "Entrar", "Alunos", "impulsa" no menu). A própria fonte fica ilegível em parágrafo ou texto pequeno — por isso ela **não** é a `--font-heading` geral.
- **Poppins** (`--font-heading` e `--font-body`) — geométrica, legível em tela pequena. Carrega tudo que Erica One não pode: botões, tags, rótulos de navegação (`h3`-`h6`), corpo de texto.

Antes existiam 15 tamanhos diferentes escritos à mão nas telas: 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 25, 29, 32, 42px. A escala reduz para 10 degraus; os fora de escala arredondam para o vizinho (9→10, 13→14, 16→17, 19→20, 29→25 ou 32 conforme o peso visual pretendido).

`--text-2xs` 10 · `--text-xs` 11 · `--text-sm` 12 · `--text-base` 14 · `--text-md` 15 · `--text-lg` 17 · `--text-xl` 20 · `--text-2xl` 25 · `--text-3xl` 32 · `--text-4xl` 42

Altura de linha: `--leading-tight` 1.12 (títulos) · `--leading-snug` 1.3 (rótulos, linhas de lista) · `--leading-normal` 1.55 (corpo).

## Espaçamento

Passo de 3.4px. O `--space-5` faltava e criava um salto de `--space-4` (13.6) direto para `--space-6` (20.4).

`1` 3.4 · `2` 6.8 · `3` 10.2 · `4` 13.6 · `5` 17 · `6` 20.4 · `8` 27.2 · `10` 34 · `12` 40.8

## Raio e elevação

`--radius-sm` 8 · `--radius-md` 12 · `--radius-lg` 18 · `--radius-full` 999 (pílula, avatar).
`--shadow-sm` (card em repouso) · `--shadow-md` (toast, elemento flutuante) · `--shadow-lg` (dialog).

## Camadas (z-index)

Antes eram números crus espalhados pelo código: tabbar 40 em `app.css`, `zIndex: 80` inline em cada um dos 11 modais, toast 90.

`--z-nav` 40 · `--z-backdrop` 80 · `--z-sheet` 81 · `--z-toast` 90

## Movimento

Ver [movimento.md](movimento.md).

## Dark mode

Ativo desde a Fase 4. Três estados possíveis, cobertos em `tokens.css`:

- **Sem escolha do usuário** — só o sistema operacional decide, via `@media (prefers-color-scheme: dark)`.
- **Escolha explícita "Escuro"** — `data-theme="dark"` no `<html>`, grava em `localStorage` (`impulsa-theme`), sempre vence o SO.
- **Escolha explícita "Claro"** — `data-theme="light"`; a regra de `@media` é escrita como `:root:not([data-theme='light'])` de propósito, pra essa escolha vencer mesmo com o SO no escuro.

Seletor em Ajustes → Aparência (`AjustesModal.tsx`), lógica em `src/lib/theme.ts`. Um script inline em `index.html` aplica o tema salvo antes da primeira pintura, pra não piscar claro antes de escurecer.

**Importante:** como boa parte das telas ainda não migrou pros componentes da Fase 1 e usa primitivo direto (`var(--color-neutral-600)`, `var(--color-bg)`), o dark mode não troca só a camada semântica — a rampa neutra inteira e os apelidos legados (`--color-bg`, `--color-text` etc.) também invertem. Só rosa e laranja (a marca) ficam fixos nos dois temas. As rampas `accent`/`accent-2`/`neutral` são geradas por fórmula (`color-mix` com a marca), e no escuro essa fórmula espelha — troca `white` por `black` e vice-versa — porque um degrau "clareado pra ficar visível em fundo claro" precisa virar "escurecido pra ficar visível em fundo escuro". Os tokens de `--status-*` **não** seguem esse espelhamento automático: foram remapeados um por um pra um degrau da rampa que já fica claro no escuro (o 800, não o 300) — light e dark não usam o mesmo degrau pro mesmo papel.

## Nome e identidade

O app se chama **Impulsa** — "seu negócio de personal, em ritmo". Nome, ícone (`src/brand/`, `public/`) e manifesto do PWA foram atualizados numa rodada à parte da Fase 0/1; os tokens de cor/tipografia foram trocados nesse mesmo momento para já nascer com a paleta certa, em vez de migrar telas duas vezes.
