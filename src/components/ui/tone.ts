/* Vocabulário de tom semântico, compartilhado por Badge e por qualquer
 * texto que precise de cor de status sem virar um chip.
 *
 * O ponto disto: o AppContext não deve mais emitir strings de CSS
 * ('var(--color-accent-800)') nem nomes de classe crus ('tag tag-accent').
 * Ele emite um Tone — um significado ('danger', 'ok') — e é este arquivo
 * que decide a cor ou a classe. Assim o dark mode da Fase 4 muda só aqui.
 */

export type Tone = 'brand' | 'neutral' | 'outline' | 'danger' | 'warning' | 'ok' | 'muted' | 'disabled';

/** Classe de chip (fundo + texto) para o Badge — reaproveita .tag-* de industry.css. */
export const TONE_TAG_CLASS: Record<Tone, string> = {
  brand: 'tag-accent',
  neutral: 'tag-neutral',
  outline: 'tag-outline',
  danger: 'tag-danger',
  warning: 'tag-warning',
  ok: 'tag-ok',
  muted: 'tag-neutral',
  disabled: 'tag-neutral',
};

/** Cor de texto puro (sem fundo) — avatar, valor monetário, linha de status. */
export const TONE_TEXT_VAR: Record<Tone, string> = {
  brand: 'var(--text-accent)',
  neutral: 'var(--text-secondary)',
  outline: 'var(--text-accent)',
  danger: 'var(--status-danger)',
  warning: 'var(--status-warning)',
  ok: 'var(--status-ok)',
  muted: 'var(--text-muted)',
  disabled: 'var(--text-disabled)',
};
