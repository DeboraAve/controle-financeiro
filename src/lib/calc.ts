import type { Aluno } from '../data/model';

export const brl = (v: number): string => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

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
