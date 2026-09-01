import type { Academia, Aluno, Despesa, Modal, Tab } from '../data/model';

export interface DomainState {
  alunos: Aluno[];
  despesas: Despesa[];
  academias: Academia[];
  grafico: 'Barras mensais' | 'Linha de caixa' | 'Anel de recebimento';
  metaMensal: number;
  diasParaAtraso: number;
  semanasPorMes: number;
}

export interface UiState {
  tab: Tab;
  alunoId: string | null;
  modal: Modal;
  filtro: 'Ativos' | 'Férias' | 'Inativos' | 'Todos';
  busca: string;
  feriasValor: string;
  despCat: string;
  despValor: string;
  despDesc: string;
  cobrandoId: string | null;
  msg: string;
  toast: string | null;
  diaSel: number | null;
  editAlunoId: string | null;
  editAcademiaId: string | null;
  editDespesaId: string | null;
}
