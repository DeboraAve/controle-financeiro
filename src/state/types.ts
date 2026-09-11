import type { Academia, Aluno, Despesa, Modal, Tab } from '../data/model';
import type { Tone } from '../components/ui/tone';

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
  cobrandoFechamentoId: string | null;
  // "Cobrar tudo" de um aluno — junta o mês corrente (se houver) com todos
  // os fechamentos em aberto dele numa mensagem e marca todos como
  // cobrado de uma vez, em vez de precisar abrir um por um.
  cobrandoIncluiMesAtual: boolean;
  cobrandoFechamentoIds: string[];
  msg: string;
  toast: { msg: string; tone: Tone } | null;
  diaSel: number | null;
  agendaView: 'semana' | 'mes';
  adminViewingUserId: string | null;
  avaliacaoDetalheId: string | null;
  editAlunoId: string | null;
  editAcademiaId: string | null;
  editDespesaId: string | null;
  editExercicioId: string | null;
  treinoDetalheId: string | null;
  editTreinoId: string | null;
  mesVisualizado: string | null;
}
