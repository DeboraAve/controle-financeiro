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
}
