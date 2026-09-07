# Movimento

Abordagem escolhida: **CSS + View Transitions API**, sem biblioteca de animação. Zero peso no bundle de um PWA que precisa abrir rápido no 4G da academia.

Tokens em [`src/styles/tokens.css`](../../src/styles/tokens.css).

## Princípio

Animação aqui serve para **explicar de onde uma coisa veio**, não para enfeitar. Se a animação não responde "isso apareceu de onde?" ou "isso foi pra onde?", ela não deveria existir.

Corolário prático: **saída é mais rápida que entrada**. Ao entrar, o movimento orienta; ao sair, o usuário já decidiu e só quer o próximo passo.

## Durações

| Token | Valor | Quando |
|---|---|---|
| `--dur-instant` | 100ms | Hover, foco, press — feedback que precisa parecer imediato |
| `--dur-fast` | 150ms | **Saída** de qualquer coisa; troca de estado pequena (badge, ícone) |
| `--dur-base` | 200ms | **Entrada** padrão: modal, toast, transição de aba |
| `--dur-slow` | 300ms | Só para movimento que percorre a tela inteira (bottom sheet subindo, Fase 2) |

Acima de 300ms o app começa a parecer lento. Se algo precisa de mais tempo, o problema é a distância percorrida, não a duração.

## Curvas

| Token | Quando |
|---|---|
| `--ease-out` | **Entrada.** Começa rápido, assenta devagar — o padrão de app nativo |
| `--ease-in` | **Saída.** Sai acelerando; o elemento "vai embora" |
| `--ease-in-out` | Movimento que começa e termina na tela (indicador de aba deslizando) |
| `--ease-spring` | Confirmação com um leve overshoot. Usar com parcimônia — no máximo um por tela |

Nunca `linear`, exceto em spinner e shimmer de skeleton, que são contínuos e não têm começo nem fim.

## Regras por padrão de UI

- **Troca de aba** — fade + deslocamento de 8px, `--dur-base` `--ease-out`. Via View Transitions API onde houver suporte; onde não houver, degrada para corte seco (não há fallback com JS).
- **Modal / dialog** — backdrop em fade `--dur-base`; conteúdo em fade + escala de 0.98→1. Fechamento em `--dur-fast` `--ease-in`.
- **Toast** — entra deslizando de baixo `--dur-base` `--ease-out`; sai em fade `--dur-fast`.
- **Botão** — `--dur-instant` no fundo. Nada de transição em `transform` de botão de lista: 40 linhas animando ao mesmo tempo custa quadro.
- **Skeleton** — shimmer de 1.5s em loop `linear`.

## `prefers-reduced-motion`

O bloco está em `tokens.css` e é global: zera as durações **e** anula toda `animation`/`transition` da página. Nenhum componente precisa de guarda própria — mas nenhum componente pode depender de uma animação para comunicar estado, porque para esses usuários ela não vai rodar.

## Suporte da View Transitions API

Chrome/Edge 111+ e Safari 18+. Firefox ainda não. É degradação suave por definição: sem suporte, a troca acontece sem animação — exatamente o comportamento de hoje. Não há regressão para quem não tem suporte.
