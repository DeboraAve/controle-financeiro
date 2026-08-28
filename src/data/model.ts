export type StatusAluno = 'ativo' | 'ferias' | 'inativo';
export type PagStatus = 'pago' | 'aberto' | 'atrasado' | 'cobrado';
export type SessaoStatus = 'feita' | 'cancelada' | 'extra';

export interface Sessao {
  id: number;
  dia: string; // "DD/09"
  s: SessaoStatus;
}

export interface Aluno {
  id: number;
  nome: string;
  inicial: string;
  plano: string;
  base: number;
  previstas: number;
  status: StatusAluno;
  pag: PagStatus;
  atraso?: number;
  horario: string;
  desde: string;
  fone: string;
  ferias: number;
  sessoes: Sessao[];
}

export interface Despesa {
  id: number;
  dia: string;
  cat: string;
  desc: string;
  valor: number;
}

export interface Ajustes {
  grafico: 'Barras mensais' | 'Linha de caixa' | 'Anel de recebimento';
  metaMensal: number;
  diasParaAtraso: number;
}

export type Tab = 'painel' | 'alunos' | 'aluno' | 'agenda' | 'caixa' | 'cobranca';

export type Modal = 'ferias' | 'inativar' | 'cobranca' | 'ajustes' | null;
