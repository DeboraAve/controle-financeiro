export type StatusAluno = 'ativo' | 'ferias' | 'inativo';
export type PagStatus = 'pago' | 'aberto' | 'atrasado' | 'cobrado';
export type SessaoStatus = 'feita' | 'cancelada' | 'extra';
export type ModeloCobranca = 'mensal_fixo' | 'por_aluno';

export interface Sessao {
  id: string;
  dia: string; // "DD/09"
  s: SessaoStatus;
}

export interface Academia {
  id: string;
  nome: string;
  modelo: ModeloCobranca;
  valorCobrado: number;
  custoPorTrecho: number;
  viagensPorSemana: number;
}

export interface Aluno {
  id: string;
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
  academiaId: string | null;
}

export interface Despesa {
  id: string;
  dia: string;
  cat: string;
  desc: string;
  valor: number;
}

export interface Ajustes {
  grafico: 'Barras mensais' | 'Linha de caixa' | 'Anel de recebimento';
  metaMensal: number;
  diasParaAtraso: number;
  semanasPorMes: number;
}

export type Tab = 'painel' | 'alunos' | 'aluno' | 'agenda' | 'caixa' | 'cobranca';

export type Modal =
  | 'ferias'
  | 'inativar'
  | 'cobranca'
  | 'ajustes'
  | 'alunoForm'
  | 'alunoExcluir'
  | 'academias'
  | 'academiaForm'
  | 'despesaForm'
  | 'avaliacaoForm'
  | null;
