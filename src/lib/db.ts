import { supabase } from './supabaseClient';
import type { Academia, Aluno, Despesa, ModeloCobranca, PagStatus, Sessao, SessaoStatus, StatusAluno } from '../data/model';

interface AcademiaRow {
  id: string;
  user_id: string;
  nome: string;
  modelo: ModeloCobranca;
  valor_cobrado: number;
  custo_por_trecho: number;
  viagens_por_semana: number;
}

interface AlunoRow {
  id: string;
  user_id: string;
  academia_id: string | null;
  nome: string;
  inicial: string;
  plano: string;
  base: number;
  previstas: number;
  status: StatusAluno;
  pag: PagStatus;
  atraso: number | null;
  horario: string;
  desde: string;
  fone: string;
  ferias: number;
}

interface SessaoRow {
  id: string;
  aluno_id: string;
  dia: string;
  status: SessaoStatus;
}

interface DespesaRow {
  id: string;
  user_id: string;
  dia: string;
  cat: string;
  descricao: string;
  valor: number;
}

interface AjustesRow {
  user_id: string;
  grafico: string;
  meta_mensal: number;
  dias_para_atraso: number;
  semanas_por_mes: number;
}

function academiaFromRow(r: AcademiaRow): Academia {
  return { id: r.id, nome: r.nome, modelo: r.modelo, valorCobrado: r.valor_cobrado, custoPorTrecho: r.custo_por_trecho, viagensPorSemana: r.viagens_por_semana };
}

function sessaoFromRow(r: SessaoRow): Sessao {
  return { id: r.id, dia: r.dia, s: r.status };
}

function alunoFromRow(r: AlunoRow, sessoes: Sessao[]): Aluno {
  return {
    id: r.id,
    academiaId: r.academia_id,
    nome: r.nome,
    inicial: r.inicial,
    plano: r.plano,
    base: r.base,
    previstas: r.previstas,
    status: r.status,
    pag: r.pag,
    atraso: r.atraso ?? undefined,
    horario: r.horario,
    desde: r.desde,
    fone: r.fone,
    ferias: r.ferias,
    sessoes,
  };
}

function despesaFromRow(r: DespesaRow): Despesa {
  return { id: r.id, dia: r.dia, cat: r.cat, desc: r.descricao, valor: r.valor };
}

export interface AjustesData {
  grafico: 'Barras mensais' | 'Linha de caixa' | 'Anel de recebimento';
  metaMensal: number;
  diasParaAtraso: number;
  semanasPorMes: number;
}

export interface RemoteDomain {
  academias: Academia[];
  alunos: Aluno[];
  despesas: Despesa[];
  ajustesPorUser: Record<string, AjustesData>;
  donoPorAluno: Record<string, string>;
  donoPorDespesa: Record<string, string>;
  donoPorAcademia: Record<string, string>;
}

export const AJUSTES_PADRAO: AjustesData = { grafico: 'Barras mensais', metaMensal: 7500, diasParaAtraso: 5, semanasPorMes: 4 };

export async function fetchDomain(userId: string): Promise<RemoteDomain> {
  const [academiasRes, alunosRes, sessoesRes, despesasRes, ajustesRes] = await Promise.all([
    supabase.from('academias').select('*').order('created_at'),
    supabase.from('alunos').select('*').order('created_at'),
    supabase.from('sessoes').select('*'),
    supabase.from('despesas').select('*').order('dia', { ascending: false }),
    supabase.from('ajustes').select('*'),
  ]);
  if (academiasRes.error) throw academiasRes.error;
  if (alunosRes.error) throw alunosRes.error;
  if (sessoesRes.error) throw sessoesRes.error;
  if (despesasRes.error) throw despesasRes.error;
  if (ajustesRes.error) throw ajustesRes.error;

  const sessoesByAluno = new Map<string, Sessao[]>();
  for (const row of (sessoesRes.data ?? []) as SessaoRow[]) {
    const list = sessoesByAluno.get(row.aluno_id) ?? [];
    list.push(sessaoFromRow(row));
    sessoesByAluno.set(row.aluno_id, list);
  }

  const ajustesPorUser: Record<string, AjustesData> = {};
  for (const r of (ajustesRes.data ?? []) as AjustesRow[]) {
    ajustesPorUser[r.user_id] = {
      grafico: r.grafico as AjustesData['grafico'],
      metaMensal: r.meta_mensal,
      diasParaAtraso: r.dias_para_atraso,
      semanasPorMes: r.semanas_por_mes,
    };
  }
  if (!ajustesPorUser[userId]) {
    ajustesPorUser[userId] = AJUSTES_PADRAO;
    await supabase.from('ajustes').insert({
      user_id: userId,
      grafico: AJUSTES_PADRAO.grafico,
      meta_mensal: AJUSTES_PADRAO.metaMensal,
      dias_para_atraso: AJUSTES_PADRAO.diasParaAtraso,
      semanas_por_mes: AJUSTES_PADRAO.semanasPorMes,
    });
  }

  const alunoRows = (alunosRes.data ?? []) as AlunoRow[];
  const donoPorAluno: Record<string, string> = {};
  for (const r of alunoRows) donoPorAluno[r.id] = r.user_id;

  const academiaRows = (academiasRes.data ?? []) as AcademiaRow[];
  const donoPorAcademia: Record<string, string> = {};
  for (const r of academiaRows) donoPorAcademia[r.id] = r.user_id;

  const despesaRows = (despesasRes.data ?? []) as DespesaRow[];
  const donoPorDespesa: Record<string, string> = {};
  for (const r of despesaRows) donoPorDespesa[r.id] = r.user_id;

  return {
    academias: academiaRows.map(academiaFromRow),
    alunos: alunoRows.map((r) => alunoFromRow(r, sessoesByAluno.get(r.id) ?? [])),
    despesas: despesaRows.map(despesaFromRow),
    ajustesPorUser,
    donoPorAluno,
    donoPorDespesa,
    donoPorAcademia,
  };
}

// ---- academias ----
export async function insertAcademia(payload: { nome: string; modelo: ModeloCobranca; valorCobrado: number; custoPorTrecho: number; viagensPorSemana: number }, ownerId?: string): Promise<Academia> {
  const { data, error } = await supabase
    .from('academias')
    .insert({
      nome: payload.nome,
      modelo: payload.modelo,
      valor_cobrado: payload.valorCobrado,
      custo_por_trecho: payload.custoPorTrecho,
      viagens_por_semana: payload.viagensPorSemana,
      ...(ownerId ? { user_id: ownerId } : {}),
    })
    .select()
    .single();
  if (error) throw error;
  return academiaFromRow(data as AcademiaRow);
}

export async function updateAcademiaRow(id: string, payload: { nome: string; modelo: ModeloCobranca; valorCobrado: number; custoPorTrecho: number; viagensPorSemana: number }): Promise<void> {
  const { error } = await supabase
    .from('academias')
    .update({ nome: payload.nome, modelo: payload.modelo, valor_cobrado: payload.valorCobrado, custo_por_trecho: payload.custoPorTrecho, viagens_por_semana: payload.viagensPorSemana })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAcademiaRow(id: string): Promise<void> {
  const { error } = await supabase.from('academias').delete().eq('id', id);
  if (error) throw error;
}

// ---- alunos ----
export interface AlunoInsertPayload {
  nome: string;
  academiaId: string | null;
  plano: string;
  base: number;
  previstas: number;
  horario: string;
  fone: string;
  desde: string;
  inicial: string;
}

export async function insertAluno(payload: AlunoInsertPayload, sessoesIniciais: { dia: string; status: SessaoStatus }[], ownerId?: string): Promise<Aluno> {
  const { data, error } = await supabase
    .from('alunos')
    .insert({
      nome: payload.nome,
      inicial: payload.inicial,
      academia_id: payload.academiaId,
      plano: payload.plano,
      base: payload.base,
      previstas: payload.previstas,
      horario: payload.horario,
      fone: payload.fone,
      desde: payload.desde,
      status: 'ativo',
      pag: 'aberto',
      ferias: 0,
      ...(ownerId ? { user_id: ownerId } : {}),
    })
    .select()
    .single();
  if (error) throw error;
  const row = data as AlunoRow;

  let sessoes: Sessao[] = [];
  if (sessoesIniciais.length) {
    const { data: sData, error: sError } = await supabase
      .from('sessoes')
      .insert(sessoesIniciais.map((s) => ({ aluno_id: row.id, dia: s.dia, status: s.status, ...(ownerId ? { user_id: ownerId } : {}) })))
      .select();
    if (sError) throw sError;
    sessoes = ((sData ?? []) as SessaoRow[]).map(sessaoFromRow);
  }
  return alunoFromRow(row, sessoes);
}

export async function updateAlunoFields(id: string, payload: AlunoInsertPayload): Promise<void> {
  const { error } = await supabase
    .from('alunos')
    .update({
      nome: payload.nome,
      inicial: payload.inicial,
      academia_id: payload.academiaId,
      plano: payload.plano,
      base: payload.base,
      previstas: payload.previstas,
      horario: payload.horario,
      fone: payload.fone,
      desde: payload.desde,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAlunoRow(id: string): Promise<void> {
  const { error } = await supabase.from('alunos').delete().eq('id', id);
  if (error) throw error;
}

export async function setAlunoPag(id: string, pag: PagStatus): Promise<void> {
  const { error } = await supabase.from('alunos').update({ pag }).eq('id', id);
  if (error) throw error;
}

export async function setAlunoStatus(id: string, status: StatusAluno, ferias?: number): Promise<void> {
  const patch: { status: StatusAluno; ferias?: number } = { status };
  if (ferias !== undefined) patch.ferias = ferias;
  const { error } = await supabase.from('alunos').update(patch).eq('id', id);
  if (error) throw error;
}

// ---- sessoes ----
export async function setSessaoStatus(id: string, status: SessaoStatus): Promise<void> {
  const { error } = await supabase.from('sessoes').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function insertSessaoExtra(alunoId: string, dia: string, ownerId?: string): Promise<Sessao> {
  const { data, error } = await supabase.from('sessoes').insert({ aluno_id: alunoId, dia, status: 'extra', ...(ownerId ? { user_id: ownerId } : {}) }).select().single();
  if (error) throw error;
  return sessaoFromRow(data as SessaoRow);
}

export async function limparAjustesRemote(alunoId: string): Promise<void> {
  const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
    supabase.from('alunos').update({ ferias: 0 }).eq('id', alunoId),
    supabase.from('sessoes').delete().eq('aluno_id', alunoId).eq('status', 'extra'),
    supabase.from('sessoes').update({ status: 'feita' }).eq('aluno_id', alunoId).eq('status', 'cancelada'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
}

// ---- despesas ----
export interface DespesaPayload {
  dia: string;
  cat: string;
  desc: string;
  valor: number;
}

export async function insertDespesa(payload: DespesaPayload, ownerId?: string): Promise<Despesa> {
  const { data, error } = await supabase.from('despesas').insert({ dia: payload.dia, cat: payload.cat, descricao: payload.desc, valor: payload.valor, ...(ownerId ? { user_id: ownerId } : {}) }).select().single();
  if (error) throw error;
  return despesaFromRow(data as DespesaRow);
}

export async function updateDespesaRow(id: string, payload: DespesaPayload): Promise<void> {
  const { error } = await supabase.from('despesas').update({ dia: payload.dia, cat: payload.cat, descricao: payload.desc, valor: payload.valor }).eq('id', id);
  if (error) throw error;
}

export async function deleteDespesaRow(id: string): Promise<void> {
  const { error } = await supabase.from('despesas').delete().eq('id', id);
  if (error) throw error;
}

// ---- ajustes ----
export async function upsertAjustes(userId: string, patch: Partial<{ grafico: string; metaMensal: number; diasParaAtraso: number; semanasPorMes: number }>): Promise<void> {
  const row: Record<string, unknown> = { user_id: userId };
  if (patch.grafico !== undefined) row.grafico = patch.grafico;
  if (patch.metaMensal !== undefined) row.meta_mensal = patch.metaMensal;
  if (patch.diasParaAtraso !== undefined) row.dias_para_atraso = patch.diasParaAtraso;
  if (patch.semanasPorMes !== undefined) row.semanas_por_mes = patch.semanasPorMes;
  const { error } = await supabase.from('ajustes').upsert(row);
  if (error) throw error;
}

// ---- avaliações físicas ----
export interface AvaliacaoRow {
  id: string;
  aluno_id: string;
  data: string;
  peso: number;
  estatura: number;
  idade: number;
  sexo: 'M' | 'F';
  dobra_peitoral: number | null;
  dobra_axilar: number | null;
  dobra_triceps: number | null;
  dobra_subescapular: number | null;
  dobra_abdominal: number | null;
  dobra_suprailiaca: number | null;
  dobra_coxa: number | null;
  dobra_biceps: number | null;
  dobra_panturrilha: number | null;
  perim_pescoco: number | null;
  perim_torax: number | null;
  perim_cintura: number | null;
  perim_abdomen: number | null;
  perim_quadril: number | null;
  observacoes: string;
}

export interface AvaliacaoPayload {
  data: string;
  peso: number;
  estatura: number;
  idade: number;
  sexo: 'M' | 'F';
  dobraPeitoral: number | null;
  dobraAxilar: number | null;
  dobraTriceps: number | null;
  dobraSubescapular: number | null;
  dobraAbdominal: number | null;
  dobraSuprailiaca: number | null;
  dobraCoxa: number | null;
  dobraBiceps: number | null;
  dobraPanturrilha: number | null;
  perimPescoco: number | null;
  perimTorax: number | null;
  perimCintura: number | null;
  perimAbdomen: number | null;
  perimQuadril: number | null;
  observacoes: string;
}

export async function fetchAvaliacoes(alunoId: string): Promise<AvaliacaoRow[]> {
  const { data, error } = await supabase.from('avaliacoes').select('*').eq('aluno_id', alunoId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AvaliacaoRow[];
}

export async function insertAvaliacao(alunoId: string, payload: AvaliacaoPayload): Promise<AvaliacaoRow> {
  const { data, error } = await supabase
    .from('avaliacoes')
    .insert({
      aluno_id: alunoId,
      data: payload.data,
      peso: payload.peso,
      estatura: payload.estatura,
      idade: payload.idade,
      sexo: payload.sexo,
      dobra_peitoral: payload.dobraPeitoral,
      dobra_axilar: payload.dobraAxilar,
      dobra_triceps: payload.dobraTriceps,
      dobra_subescapular: payload.dobraSubescapular,
      dobra_abdominal: payload.dobraAbdominal,
      dobra_suprailiaca: payload.dobraSuprailiaca,
      dobra_coxa: payload.dobraCoxa,
      dobra_biceps: payload.dobraBiceps,
      dobra_panturrilha: payload.dobraPanturrilha,
      perim_pescoco: payload.perimPescoco,
      perim_torax: payload.perimTorax,
      perim_cintura: payload.perimCintura,
      perim_abdomen: payload.perimAbdomen,
      perim_quadril: payload.perimQuadril,
      observacoes: payload.observacoes,
    })
    .select()
    .single();
  if (error) throw error;
  return data as AvaliacaoRow;
}

export async function deleteAvaliacaoRow(id: string): Promise<void> {
  const { error } = await supabase.from('avaliacoes').delete().eq('id', id);
  if (error) throw error;
}

// ---- profile / papel (admin ou personal) ----
export type MensalidadeStatus = 'pago' | 'aberto' | 'atrasado' | 'cobrado';

export interface ProfileRow {
  id: string;
  role: 'admin' | 'personal';
  nome: string;
  email: string;
  fone: string;
  mensalidade_valor: number;
  mensalidade_status: MensalidadeStatus;
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function fetchAllProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export async function updateProfileBilling(id: string, patch: Partial<{ fone: string; mensalidadeValor: number; mensalidadeStatus: MensalidadeStatus }>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.fone !== undefined) row.fone = patch.fone;
  if (patch.mensalidadeValor !== undefined) row.mensalidade_valor = patch.mensalidadeValor;
  if (patch.mensalidadeStatus !== undefined) row.mensalidade_status = patch.mensalidadeStatus;
  const { error } = await supabase.from('profiles').update(row).eq('id', id);
  if (error) throw error;
}
