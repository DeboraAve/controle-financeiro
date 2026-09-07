import type { ReactNode } from 'react';
import { TONE_TAG_CLASS, type Tone } from './tone';

/** Encapsula .tag/.tag-* de industry.css. Recebe um `tone` semântico — não
 * uma classe CSS crua — para que o AppContext nunca precise saber que
 * "atrasado" é laranja. */
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`tag ${TONE_TAG_CLASS[tone]}`}>{children}</span>;
}
