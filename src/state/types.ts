import type { Aluno, Despesa, Modal, Tab } from '../data/model';

export interface DomainState {
  alunos: Aluno[];
  despesas: Despesa[];
  grafico: 'Barras mensais' | 'Linha de caixa' | 'Anel de recebimento';
  metaMensal: number;
  diasParaAtraso: number;
}

export interface UiState {
  tab: Tab;
  alunoId: number | null;
  modal: Modal;
  filtro: 'Ativos' | 'Férias' | 'Inativos' | 'Todos';
  busca: string;
  feriasValor: string;
  despCat: string;
  despValor: string;
  despDesc: string;
  cobrandoId: number | null;
  msg: string;
  toast: string | null;
  diaSel: number | null;
}
