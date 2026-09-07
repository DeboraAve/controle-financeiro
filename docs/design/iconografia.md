# Iconografia

Biblioteca: **Lucide** (`lucide-react`), traço aberto, cantos arredondados — combina com o `--radius-md` e o traço redondo do símbolo da Impulsa.

Mapa único: [`src/components/ui/icons.ts`](../../src/components/ui/icons.ts). **Nenhuma tela importa `lucide-react` direto.** Trocar um ícone, ou a biblioteca inteira, é editar um arquivo só.

A marca em si (o símbolo do pulso/seta) não é um ícone da biblioteca — é [`BrandMark`](../../src/components/ui/BrandMark.tsx), a geometria oficial da Impulsa (mesma de `src/brand/mark.svg`), usada no menu lateral.

## O que sai

O `Marker` de [`Nav.tsx`](../../src/components/Nav.tsx) — um `<div>` de 15×15px com `border-radius: 5px` e uma cor de fundo. Cinco quadrados iguais, distinguíveis só pela cor, sem significado nenhum. É o item mais visível da lista de "cheira a site" do PRD.

## O que entra

| Nome no código | Ícone Lucide | Onde |
|---|---|---|
| `IconePainel` | `LayoutDashboard` | Aba Painel |
| `IconeAlunos` | `Users` | Aba Alunos |
| `IconeAgenda` | `CalendarDays` | Aba Agenda |
| `IconeCaixa` | `Wallet` | Aba Caixa |
| `IconeCobranca` | `HandCoins` | Aba Cobrar |
| `IconeFechar` | `X` | Fechar modal |
| `IconeVoltar` | `ArrowLeft` | Voltar do detalhe |
| `IconeMais` | `Plus` | Novo aluno, nova despesa |
| `IconeBusca` | `Search` | Campo de busca |
| `IconeEditar` | `Pencil` | Editar aluno, academia, despesa |
| `IconeExcluir` | `Trash2` | Excluir |
| `IconeConfirmar` | `Check` | Marcar feita, marcar pago |
| `IconeOk` / `IconeErro` / `IconeAviso` | `CircleCheck` / `CircleX` / `CircleAlert` | Toast e empty state |
| `IconeCarregando` | `Loader2` | Spinner (gira via CSS) |

## Regras de uso

**Tamanho** — usar `TAMANHO_ICONE`, nunca um número solto:
- `sm` 16 — acompanhando texto na mesma linha
- `md` 20 — padrão de navegação e botão
- `lg` 24 — destaque
- `xl` 32 — empty state

**Traço** — manter o `strokeWidth` padrão (2). Não misturar espessuras: é o que faz um conjunto parecer uma família.

**Cor** — os ícones herdam `currentColor`. Definir a cor no elemento pai, nunca passar `color` no ícone; assim o estado ativo/inativo e o dark mode funcionam sozinhos.

**Acessibilidade** — ícone decorativo (ao lado de um rótulo, como na tab bar) vai com `aria-hidden`. Ícone sozinho como única pista (botão de fechar) precisa de `aria-label` no botão.

**Semântica antes de estética** — um ícone só entra se comunicar a ação. Na dúvida, rótulo em texto resolve melhor.
