import type { Aluno } from '../data/model';

export const brl = (v: number): string => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

/* `desde` guarda uma data ISO (aaaa-mm-dd, o formato de <input type="date">)
 * desde que o vencimento por aluno passou a existir. Cadastros antigos têm
 * texto livre tipo "mar/24" — sem dia, então não dá pra derivar vencimento
 * deles; `diaVencimentoDe` volta `null` nesse caso, e quem chama cai de
 * volta no comportamento antigo (configuração global de Ajustes) até a
 * pessoa reabrir o cadastro e escolher uma data de verdade. */
const RE_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function diaVencimentoDe(desde: string): number | null {
  const m = RE_DATA_ISO.exec(desde);
  if (!m) return null;
  const dia = parseInt(m[3], 10);
  return dia >= 1 && dia <= 31 ? dia : null;
}

export function formatarDesde(desde: string): string {
  const m = RE_DATA_ISO.exec(desde);
  if (!m) return desde; // cadastro antigo — mostra do jeito que foi digitado
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export interface Calculo {
  valorAula: number;
  canceladas: number;
  extras: number;
  descCancel: number;
  ferias: number;
  totalExtras: number;
  total: number;
}

export function calc(a: Aluno): Calculo {
  const valorAula = a.base / a.previstas;
  const canceladas = a.sessoes.filter((s) => s.s === 'cancelada').length;
  const extras = a.sessoes.filter((s) => s.s === 'extra').length;
  const descCancel = canceladas * valorAula;
  const ferias = a.status === 'ferias' ? a.ferias : 0;
  const totalExtras = extras * valorAula;
  const total = a.status === 'inativo' ? 0 : Math.max(0, a.base - descCancel - ferias + totalExtras);
  return { valorAula, canceladas, extras, descCancel, ferias, totalExtras, total };
}
