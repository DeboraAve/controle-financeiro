import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Academia, Aluno, Despesa, ModeloCobranca } from '../data/model';
import { ACADEMIA_MODELOS, CATS, criarSessoesPadrao, dia2, iniciais } from '../data/seed';
import { brl, calc } from '../lib/calc';
import { calcularAvaliacao, calcularRcq } from '../lib/avaliacaoCalc';
import * as db from '../lib/db';
import { useAuth } from './AuthContext';
import type { DomainState, UiState } from './types';

const initialUi: UiState = {
  tab: 'painel',
  alunoId: null,
  modal: null,
  filtro: 'Ativos',
  busca: '',
  feriasValor: '',
  despCat: 'Equipamento',
  despValor: '',
  despDesc: '',
  cobrandoId: null,
  msg: '',
  toast: null,
  diaSel: null,
  agendaView: 'semana',
  adminViewingUserId: null,
  editAlunoId: null,
  editAcademiaId: null,
  editDespesaId: null,
};

interface DomainRaw {
  alunos: Aluno[];
  despesas: Despesa[];
  academias: Academia[];
}

const emptyDomainRaw: DomainRaw = { alunos: [], despesas: [], academias: [] };

export interface AlunoListItem {
  id: string;
  nome: string;
  inicial: string;
  inicialCor: string;
  sub: string;
  totalFmt: string;
  tagClass: string;
  tagTexto: string;
  pagTexto: string;
  pagCor: string;
  abrir: () => void;
}

export interface AlunoDetalheVm {
  id: string;
  nome: string;
  desde: string;
  tagClass: string;
  tagTexto: string;
  linhaBase: string;
  sub: string;
  baseFmt: string;
  descCancelFmt: string;
  feriasFmt: string;
  extrasFmt: string;
  totalFmt: string;
  valorAulaFmt: string;
  temFerias: boolean;
  canceladasTxt: string;
  extrasTxt: string;
  pagFrase: string;
  textoFerias: string;
  textoInativo: string;
  acaoPagamentoTexto: string;
  acaoPagamento: () => void;
  media: string;
  historico: { mes: string; nota: string; valor: string }[];
  sessoes: {
    id: string;
    dia: string;
    rotulo: string;
    borda: string;
    fundo: string;
    cor: string;
    toggle: () => void;
  }[];
}

export interface AlunoFormPayload {
  nome: string;
  academiaId: string | null;
  planoTipo: 'Pacote' | 'Mensalidade fixa';
  valorPacote: number;
  aulasPrevistas: number;
  horario: string;
  fone: string;
  desde: string;
}

export interface AcademiaFormPayload {
  nome: string;
  modelo: ModeloCobranca;
  valorCobrado: number;
  custoPorTrecho: number;
  viagensPorSemana: number;
}

export interface DespesaFormPayload {
  dia: string;
  cat: string;
  desc: string;
  valor: number;
}

export interface AvaliacaoFormPayload {
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

function custoAcademiaCalc(ac: Academia, nAtivos: number, semanasPorMes: number) {
  const base = ac.modelo === 'mensal_fixo' ? ac.valorCobrado : ac.valorCobrado * nAtivos;
  const desloc = ac.custoPorTrecho * ac.viagensPorSemana * semanasPorMes;
  const total = nAtivos > 0 ? base + desloc : 0;
  return { base, desloc, total };
}

function useAppStateInternal(userId: string, isAdmin: boolean) {
  const [domainRaw, setDomainRaw] = useState<DomainRaw>(emptyDomainRaw);
  const [donoPorAluno, setDonoPorAluno] = useState<Record<string, string>>({});
  const [donoPorDespesa, setDonoPorDespesa] = useState<Record<string, string>>({});
  const [donoPorAcademia, setDonoPorAcademia] = useState<Record<string, string>>({});
  const [ajustesPorUser, setAjustesPorUser] = useState<Record<string, db.AjustesData>>({});
  const [profiles, setProfiles] = useState<db.ProfileRow[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<db.AvaliacaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ui, setUi] = useState<UiState>(initialUi);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const patchUi = useCallback((p: Partial<UiState>) => setUi((s) => ({ ...s, ...p })), []);

  const showToast = useCallback((t: string) => {
    clearTimeout(toastTimer.current);
    patchUi({ toast: t });
    toastTimer.current = setTimeout(() => patchUi({ toast: null }), 2600);
  }, [patchUi]);

  const reportError = useCallback((e: unknown) => {
    const msg = e instanceof Error ? e.message : 'Erro ao salvar';
    showToast('Não deu pra salvar — ' + msg);
  }, [showToast]);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    db.fetchDomain(userId)
      .then((remote) => {
        if (!ativo) return;
        setDomainRaw({
          alunos: remote.alunos,
          despesas: remote.despesas,
          academias: remote.academias,
        });
        setDonoPorAluno(remote.donoPorAluno);
        setDonoPorDespesa(remote.donoPorDespesa);
        setDonoPorAcademia(remote.donoPorAcademia);
        setAjustesPorUser(remote.ajustesPorUser);
      })
      .catch((e) => reportError(e))
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [userId, reportError]);

  useEffect(() => {
    if (!isAdmin) {
      setProfiles([]);
      return;
    }
    let ativo = true;
    db.fetchAllProfiles()
      .then((rows) => ativo && setProfiles(rows))
      .catch((e) => reportError(e));
    return () => {
      ativo = false;
    };
  }, [isAdmin, reportError]);

  const patchAlunoLocal = useCallback((id: string, fn: (a: Aluno) => Aluno) => {
    setDomainRaw((s) => ({
      ...s,
      alunos: s.alunos.map((a) => (a.id === id ? fn({ ...a, sessoes: a.sessoes.map((x) => ({ ...x })) }) : a)),
    }));
  }, []);

  const atual = domainRaw.alunos.find((a) => a.id === ui.alunoId);

  useEffect(() => {
    if (!atual) {
      setAvaliacoes([]);
      return;
    }
    let ativo = true;
    db.fetchAvaliacoes(atual.id)
      .then((rows) => ativo && setAvaliacoes(rows))
      .catch((e) => reportError(e));
    return () => {
      ativo = false;
    };
  }, [atual?.id, reportError]);

  const vm = useMemo(() => {
    const S = ui;
    const effectiveOwnerId = isAdmin ? S.adminViewingUserId : userId;
    const ajustesAtuais = (effectiveOwnerId && ajustesPorUser[effectiveOwnerId]) || db.AJUSTES_PADRAO;
    const domain: DomainState = effectiveOwnerId
      ? {
          alunos: domainRaw.alunos.filter((a) => donoPorAluno[a.id] === effectiveOwnerId),
          despesas: domainRaw.despesas.filter((d) => donoPorDespesa[d.id] === effectiveOwnerId),
          academias: domainRaw.academias.filter((ac) => donoPorAcademia[ac.id] === effectiveOwnerId),
          grafico: ajustesAtuais.grafico,
          metaMensal: ajustesAtuais.metaMensal,
          diasParaAtraso: ajustesAtuais.diasParaAtraso,
          semanasPorMes: ajustesAtuais.semanasPorMes,
        }
      : { alunos: [], despesas: [], academias: [], ...db.AJUSTES_PADRAO };
    const isGestao = isAdmin && !S.adminViewingUserId;
    const personaisResumo = profiles
      .filter((p) => p.role === 'personal')
      .map((p) => {
        const seusAlunos = domainRaw.alunos.filter((a) => donoPorAluno[a.id] === p.id);
        const ativosP = seusAlunos.filter((a) => a.status !== 'inativo');
        const receita = ativosP.reduce((t, a) => t + calc(a).total, 0);
        const atrasadosP = ativosP.filter((a) => a.pag === 'atrasado').length;
        return {
          id: p.id,
          nome: p.nome || p.email,
          email: p.email,
          alunosAtivos: ativosP.length,
          receitaFmt: brl(receita),
          atrasados: atrasadosP,
          entrar: () => patchUi({ adminViewingUserId: p.id, tab: 'painel' }),
        };
      });
    const meta = domain.metaMensal;
    const prazo = domain.diasParaAtraso;
    const vizNome = domain.grafico;
    const semanasPorMes = domain.semanasPorMes;
    const ativos = domain.alunos.filter((a) => a.status !== 'inativo');
    const calcs = new Map(domain.alunos.map((a) => [a.id, calc(a)]));

    const soma = (f: (a: Aluno) => boolean) => ativos.filter(f).reduce((t, a) => t + calcs.get(a.id)!.total, 0);
    const previsto = soma(() => true);
    const recebido = soma((a) => a.pag === 'pago');
    const aberto = soma((a) => a.pag === 'aberto' || a.pag === 'cobrado');
    const atrasado = soma((a) => a.pag === 'atrasado');
    const base = ativos.reduce((t, a) => t + a.base, 0);
    const descontos = ativos.reduce((t, a) => t + calcs.get(a.id)!.descCancel + calcs.get(a.id)!.ferias, 0);
    const extras = ativos.reduce((t, a) => t + calcs.get(a.id)!.totalExtras, 0);
    const despSoltasTotal = domain.despesas.reduce((t, d) => t + d.valor, 0);

    const custosAcademias = domain.academias.map((ac) => {
      const nAtivos = ativos.filter((al) => al.academiaId === ac.id).length;
      return { academia: ac, nAtivos, ...custoAcademiaCalc(ac, nAtivos, semanasPorMes) };
    });
    const custoAcademiasTotal = custosAcademias.reduce((t, c) => t + c.total, 0);
    const despTotal = despSoltasTotal + custoAcademiasTotal;

    const lucro = previsto - despTotal;
    const metaPct = Math.min(100, Math.round((previsto / meta) * 100));
    const faltam = meta - previsto;

    const ranking = [...ativos].sort((x, y) => calcs.get(y.id)!.total - calcs.get(x.id)!.total);
    const top = ranking.slice(0, 3).map((a) => ({
      nome: a.nome,
      totalFmt: brl(calcs.get(a.id)!.total),
      pct: Math.round((calcs.get(a.id)!.total / (calcs.get(ranking[0]?.id ?? a.id)!.total || 1)) * 100),
    }));
    const top3 = ranking.slice(0, 3).reduce((t, a) => t + calcs.get(a.id)!.total, 0);

    const canceladasTotais = ativos.reduce((t, a) => t + calcs.get(a.id)!.canceladas, 0);
    const emAtraso = ativos.filter((a) => a.pag === 'atrasado');

    const historico = [6800, 7150, 7420, 7900];
    const valores = [...historico, previsto, Math.round(previsto * 1.06)];
    const nomes = ['mai', 'jun', 'jul', 'ago', 'set', 'out'];
    const maxV = Math.max(...valores);
    const meses = valores.map((v, i) => ({
      nome: nomes[i],
      rotulo: (v / 1000).toFixed(1) + 'k',
      h: Math.round((v / maxV) * 88),
      cor: i === 4 ? 'var(--color-accent)' : i === 5 ? 'transparent' : 'var(--color-accent-200)',
      borda: i === 5 ? 'var(--color-accent-400)' : i === 4 ? 'var(--color-accent)' : 'var(--color-accent-300)',
      texto: i === 4 ? 'var(--color-accent-800)' : 'var(--color-neutral-600)',
    }));
    const pt = (i: number, v: number) => i * 60 + ',' + (108 - (v / maxV) * 100).toFixed(1);
    const recPct = Math.round((recebido / (previsto || 1)) * 100);
    const abPct = Math.round((aberto / (previsto || 1)) * 100);

    const filtros = (['Ativos', 'Férias', 'Inativos', 'Todos'] as const).map((f) => ({
      rotulo: f,
      on: S.filtro === f,
      set: () => patchUi({ filtro: f }),
    }));

    const academiaNome = (id: string | null) => domain.academias.find((ac) => ac.id === id)?.nome ?? null;
    const profilesPorId = new Map(profiles.map((p) => [p.id, p]));

    const tagDe = (a: Aluno) =>
      a.status === 'ferias'
        ? { tagClass: 'tag tag-outline', tagTexto: 'Férias' }
        : a.status === 'inativo'
          ? { tagClass: 'tag tag-neutral', tagTexto: 'Inativo' }
          : { tagClass: 'tag tag-accent', tagTexto: 'Ativo' };
    const pagDe = (a: Aluno) =>
      a.pag === 'pago'
        ? { pagTexto: 'pago', pagCor: 'var(--color-neutral-600)' }
        : a.pag === 'atrasado'
          ? { pagTexto: (a.atraso || prazo) + ' dias em atraso', pagCor: 'var(--color-accent-800)' }
          : a.pag === 'cobrado'
            ? { pagTexto: 'cobrado hoje', pagCor: 'var(--color-accent-700)' }
            : { pagTexto: 'vence dia ' + String(prazo).padStart(2, '0'), pagCor: 'var(--color-neutral-600)' };

    const visiveis = domain.alunos.filter((a) => {
      const okF =
        S.filtro === 'Todos' ||
        (S.filtro === 'Ativos' && a.status === 'ativo') ||
        (S.filtro === 'Férias' && a.status === 'ferias') ||
        (S.filtro === 'Inativos' && a.status === 'inativo');
      const okB = !S.busca || a.nome.toLowerCase().includes(S.busca.toLowerCase());
      return okF && okB;
    });
    const listaAlunos: AlunoListItem[] = visiveis.map((a) => {
      const c = calcs.get(a.id)!;
      const nomeAcademia = academiaNome(a.academiaId);
      return {
        id: a.id,
        nome: a.nome,
        inicial: a.inicial,
        inicialCor: a.status === 'inativo' ? 'var(--color-neutral-500)' : 'var(--color-accent-700)',
        sub: a.plano + ' · ' + a.horario + (nomeAcademia ? ' · ' + nomeAcademia : ''),
        totalFmt: brl(c.total),
        ...tagDe(a),
        ...pagDe(a),
        abrir: () => patchUi({ tab: 'aluno', alunoId: a.id }),
      };
    });

    const a = atual;
    let aluno: AlunoDetalheVm | undefined;
    if (a) {
      const c = calcs.get(a.id)!;
      aluno = {
        id: a.id,
        nome: a.nome,
        desde: a.desde,
        ...tagDe(a),
        linhaBase: a.plano.startsWith('Pacote') ? 'Pacote ' + a.previstas + ' aulas' : a.plano + ' · ' + a.previstas + ' aulas',
        sub: a.plano + ' · ' + a.horario + (academiaNome(a.academiaId) ? ' · ' + academiaNome(a.academiaId) : ''),
        baseFmt: brl(a.base),
        descCancelFmt: brl(c.descCancel),
        feriasFmt: brl(c.ferias),
        extrasFmt: brl(c.totalExtras),
        totalFmt: brl(c.total),
        valorAulaFmt: brl(c.valorAula),
        temFerias: c.ferias > 0,
        canceladasTxt: c.canceladas + (c.canceladas === 1 ? ' aula cancelada' : ' aulas canceladas'),
        extrasTxt: c.extras + (c.extras === 1 ? ' aula extra' : ' aulas extras'),
        pagFrase: a.status === 'inativo' ? 'aluno inativo — nada a cobrar' : pagDe(a).pagTexto,
        textoFerias: a.status === 'ferias' ? 'Voltou das férias' : 'Marcar férias',
        textoInativo: a.status === 'inativo' ? 'Reativar aluno' : 'Inativar aluno',
        acaoPagamentoTexto: a.pag === 'pago' ? 'Pagamento recebido ✓' : 'Registrar pagamento de ' + brl(c.total),
        acaoPagamento: () => {
          patchAlunoLocal(a.id, (x) => ({ ...x, pag: 'pago' }));
          db.setAlunoPag(a.id, 'pago').catch(reportError);
          showToast('Pagamento de ' + a.nome + ' registrado.');
        },
        media: brl((a.base * 3.6) / 4),
        historico: [
          { mes: 'agosto', nota: 'pacote cheio', valor: brl(a.base) },
          { mes: 'julho', nota: '1 cancelada', valor: brl(a.base - a.base / a.previstas) },
          { mes: 'junho', nota: '+1 extra', valor: brl(a.base + a.base / a.previstas) },
          { mes: 'maio', nota: 'pacote cheio', valor: brl(a.base) },
        ],
        sessoes: a.sessoes.map((s) => ({
          id: s.id,
          dia: s.dia.slice(0, 2),
          rotulo: s.s === 'cancelada' ? 'cancel.' : s.s === 'extra' ? 'extra' : 'ok',
          borda: s.s === 'cancelada' ? 'var(--color-neutral-400)' : s.s === 'extra' ? 'var(--color-accent-800)' : 'var(--color-divider)',
          fundo: s.s === 'extra' ? 'var(--color-accent-800)' : s.s === 'cancelada' ? 'var(--color-neutral-200)' : 'transparent',
          cor: s.s === 'extra' ? 'var(--color-bg)' : s.s === 'cancelada' ? 'var(--color-neutral-600)' : 'var(--color-text)',
          toggle: () => {
            const novo = s.s === 'feita' ? 'cancelada' : 'feita';
            patchAlunoLocal(a.id, (x) => ({
              ...x,
              sessoes: x.sessoes.map((y) => (y.id === s.id ? { ...y, s: novo } : y)),
            }));
            db.setSessaoStatus(s.id, novo).catch(reportError);
          },
        })),
      };
    }

    const cobraveis = domain.alunos.filter((x) => x.status !== 'inativo' && x.pag !== 'pago');
    const cobrando = domain.alunos.find((x) => x.id === S.cobrandoId) || { nome: '', fone: '' };

    const diasComAula: Record<number, number> = {};
    const sessoesPorDia: Record<number, number> = {};
    ativos.forEach((x) =>
      x.sessoes.forEach((s) => {
        const n = parseInt(s.dia, 10);
        if (s.s === 'cancelada') return;
        diasComAula[n] = (diasComAula[n] || 0) + calcs.get(x.id)!.valorAula;
        sessoesPorDia[n] = (sessoesPorDia[n] || 0) + 1;
      }),
    );
    const agora = new Date();
    const hojeDia = agora.getFullYear() === 2026 && agora.getMonth() === 8 ? agora.getDate() : 15;
    const selecionado = Math.min(30, Math.max(1, S.diaSel || hojeDia));
    const diaSemanaDe = (n: number) => new Date(2026, 8, n).getDay();
    const nomesSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

    const inicioSemana = selecionado - diaSemanaDe(selecionado);
    const semanaAtual: {
      n: number | string;
      rotulo: string;
      valor: number | string;
      borda: string;
      fundo: string;
      cor: string;
      cursor: string;
      selecionar: () => void;
      key: string;
    }[] = [];
    for (let i = 0; i < 7; i++) {
      const n = inicioSemana + i;
      if (n < 1 || n > 30) {
        semanaAtual.push({ n: '', rotulo: nomesSemana[i], valor: '', borda: 'transparent', fundo: 'transparent', cor: 'transparent', cursor: 'default', selecionar: () => {}, key: 'wpad' + i });
        continue;
      }
      const v = diasComAula[n] || 0;
      const sel = n === selecionado;
      const ehHoje = n === hojeDia;
      semanaAtual.push({
        n,
        rotulo: nomesSemana[i],
        valor: v ? Math.round(v / 10) * 10 : '',
        borda: sel ? 'var(--color-accent-800)' : ehHoje ? 'var(--color-accent-700)' : v ? 'var(--color-accent)' : 'var(--color-divider)',
        fundo: sel ? 'var(--color-accent-800)' : v ? 'var(--color-accent-200)' : 'transparent',
        cor: sel ? 'var(--color-bg)' : v ? 'var(--color-accent-900)' : 'var(--color-neutral-500)',
        cursor: 'pointer',
        selecionar: () => patchUi({ diaSel: n }),
        key: 'w' + n,
      });
    }
    const temSemanaAnterior = inicioSemana - 7 + 6 >= 1;
    const temSemanaSeguinte = inicioSemana + 7 <= 30;
    let diasLivresSemana = 0;
    let aulasSemana = 0;
    for (let i = 0; i < 7; i++) {
      const n = inicioSemana + i;
      if (n < 1 || n > 30) continue;
      const qtd = sessoesPorDia[n] || 0;
      aulasSemana += qtd;
      if (qtd === 0) diasLivresSemana++;
    }

    const diasMes: {
      n: number | string;
      valor: number | string;
      borda: string;
      fundo: string;
      cor: string;
      cursor: string;
      selecionar: () => void;
      key: string;
    }[] = [];
    for (let i = 0; i < 2; i++) {
      diasMes.push({ n: '', valor: '', borda: 'transparent', fundo: 'transparent', cor: 'transparent', cursor: 'default', selecionar: () => {}, key: 'pad' + i });
    }
    for (let n = 1; n <= 30; n++) {
      const v = diasComAula[n] || 0;
      const sel = n === selecionado;
      diasMes.push({
        n,
        valor: v ? Math.round(v / 10) * 10 : '',
        borda: sel ? 'var(--color-accent-800)' : v ? 'var(--color-accent)' : 'var(--color-divider)',
        fundo: sel ? 'var(--color-accent-800)' : v ? 'var(--color-accent-200)' : 'transparent',
        cor: sel ? 'var(--color-bg)' : v ? 'var(--color-accent-900)' : 'var(--color-neutral-500)',
        cursor: 'pointer',
        selecionar: () => patchUi({ diaSel: n }),
        key: 'd' + n,
      });
    }
    const aulasDoDia: { hora: string; nome: string; nota: string; valor: string; key: string; statusClasse: string; statusTexto: string; toggle: () => void }[] = [];
    ativos.forEach((x) =>
      x.sessoes.forEach((s) => {
        if (parseInt(s.dia, 10) !== selecionado) return;
        const c = calcs.get(x.id)!;
        const horaMatch = x.horario.match(/\d{2}h/);
        aulasDoDia.push({
          hora: horaMatch ? horaMatch[0] : '07h',
          nome: x.nome,
          nota: s.s === 'cancelada' ? 'cancelada — desconto no mês' : s.s === 'extra' ? 'extra — soma no mês' : x.plano,
          valor: (s.s === 'cancelada' ? '− ' : '') + brl(c.valorAula),
          key: x.id + '-' + s.id,
          statusClasse: 'tag ' + (s.s === 'cancelada' ? 'tag-outline' : s.s === 'extra' ? 'tag-accent' : 'tag-neutral'),
          statusTexto: s.s === 'cancelada' ? 'cancelada' : s.s === 'extra' ? 'extra' : 'feita',
          toggle: () => {
            const novo = s.s === 'feita' ? 'cancelada' : 'feita';
            patchAlunoLocal(x.id, (a) => ({
              ...a,
              sessoes: a.sessoes.map((y) => (y.id === s.id ? { ...y, s: novo } : y)),
            }));
            db.setSessaoStatus(s.id, novo).catch(reportError);
          },
        });
      }),
    );
    const totalDia = aulasDoDia.reduce((t, s) => t + (s.valor.startsWith('−') ? 0 : parseFloat(s.valor.replace(/[^\d]/g, ''))), 0);

    const academiasResumo = custosAcademias.map(({ academia: ac, nAtivos, base: baseC, desloc, total }) => ({
      id: ac.id,
      nome: ac.nome,
      modeloTexto: ac.modelo === 'mensal_fixo' ? 'Mensal fixo' : 'Por aluno',
      valorCobradoFmt: brl(ac.valorCobrado),
      deslocTexto: ac.custoPorTrecho > 0 ? brl(ac.custoPorTrecho) + ' × ' + ac.viagensPorSemana + '/sem' : '—',
      nAtivos,
      baseFmt: brl(baseC),
      deslocFmt: brl(desloc),
      custoMensalFmt: brl(total),
      editar: () => patchUi({ modal: 'academiaForm', editAcademiaId: ac.id }),
      excluir: () => {
        if (nAtivos > 0) {
          showToast('Tem ' + nAtivos + ' aluno(s) em ' + ac.nome + ' — troque a academia deles antes de excluir.');
          return;
        }
        setDomainRaw((s) => ({ ...s, academias: s.academias.filter((x) => x.id !== ac.id) }));
        db.deleteAcademiaRow(ac.id).catch(reportError);
        showToast(ac.nome + ' excluída.');
      },
    }));

    const editandoAcademia = domain.academias.find((ac) => ac.id === S.editAcademiaId) ?? null;
    const editandoAluno = domain.alunos.find((al) => al.id === S.editAlunoId) ?? null;
    const editandoDespesa = domain.despesas.find((d) => d.id === S.editDespesaId) ?? null;

    const avaliacoesFmt = avaliacoes.map((r) => {
      const res = calcularAvaliacao({
        peso: r.peso,
        estatura: r.estatura,
        idade: r.idade,
        sexo: r.sexo,
        dobraPeitoral: r.dobra_peitoral,
        dobraAxilar: r.dobra_axilar,
        dobraTriceps: r.dobra_triceps,
        dobraSubescapular: r.dobra_subescapular,
        dobraAbdominal: r.dobra_abdominal,
        dobraSuprailiaca: r.dobra_suprailiaca,
        dobraCoxa: r.dobra_coxa,
      });
      const rcq = calcularRcq(r.sexo, r.perim_cintura, r.perim_quadril);
      return {
        id: r.id,
        data: r.data,
        pesoFmt: r.peso.toLocaleString('pt-BR') + ' kg',
        imcFmt: res.imc.toFixed(1),
        imcClasse: res.imcClasse,
        risco: res.risco,
        temDobras: res.temDobras,
        percentualGorduraFmt: res.percentualGordura != null ? res.percentualGordura.toFixed(1) + '%' : '—',
        massaMagraFmt: res.massaMagra != null ? res.massaMagra.toFixed(1) + ' kg' : '—',
        rcqFmt: rcq ? rcq.valor.toFixed(2) + ' (' + rcq.classe + ')' : null,
        observacoes: r.observacoes,
        excluir: () => {
          setAvaliacoes((s) => s.filter((x) => x.id !== r.id));
          db.deleteAvaliacaoRow(r.id).catch(reportError);
          showToast('Avaliação excluída.');
        },
      };
    });

    return {
      loading,
      isAdmin,
      isGestao,
      personaisResumo,
      viewingComo: S.adminViewingUserId ? (profilesPorId.get(S.adminViewingUserId)?.nome || profilesPorId.get(S.adminViewingUserId)?.email || '') : null,
      voltarGestao: () => patchUi({ adminViewingUserId: null, tab: 'painel' }),
      isPainel: S.tab === 'painel',
      isAlunos: S.tab === 'alunos',
      isDetalhe: S.tab === 'aluno' && !!a,
      isAgenda: S.tab === 'agenda',
      isCaixa: S.tab === 'caixa',
      isCobranca: S.tab === 'cobranca',
      resumo: {
        previsto: brl(previsto),
        base: brl(base),
        descontos: brl(descontos),
        extras: brl(extras),
        recebido: brl(recebido),
        aberto: brl(aberto),
        atrasado: brl(atrasado),
        pagos: ativos.filter((x) => x.pag === 'pago').length,
        abertos: ativos.filter((x) => x.pag === 'aberto' || x.pag === 'cobrado').length,
        atrasados: emAtraso.length,
        despesas: brl(despTotal),
        despesasSoltasFmt: brl(despSoltasTotal),
        custoAcademiasFmt: brl(custoAcademiasTotal),
        qtdDespesas: domain.despesas.length,
        lucro: brl(lucro),
        margem: Math.round((lucro / (previsto || 1)) * 100),
        saldo: brl(recebido - despTotal),
        meta: brl(meta),
        metaPct,
        metaFrase: faltam > 0 ? 'Faltam ' + brl(faltam) + ' pra bater a meta' : 'Meta batida — ' + brl(-faltam) + ' acima',
        recebidoPct: recPct,
        concentracao: ranking.length ? 'Os 3 primeiros são ' + Math.round((top3 / (previsto || 1)) * 100) + '% do seu mês.' : 'Cadastre alunos pra ver sua concentração de receita.',
        alerta: emAtraso.length
          ? emAtraso.length + (emAtraso.length === 1 ? ' aluno atrasado somando ' : ' alunos atrasados somando ') + brl(atrasado) + '. ' + canceladasTotais + ' cancelamentos já tiraram ' + brl(descontos) + ' do fechamento.'
          : 'Nenhum atraso. ' + canceladasTotais + ' cancelamentos tiraram ' + brl(descontos) + ' do mês.',
      },
      meses,
      viz: {
        titulo: vizNome === 'Anel de recebimento' ? 'Composição do mês' : 'Caixa mês a mês',
        legenda: vizNome === 'Anel de recebimento' ? 'previsto ' + brl(previsto) : 'out projetado',
        barras: vizNome === 'Barras mensais',
        linha: vizNome === 'Linha de caixa',
        anel: vizNome === 'Anel de recebimento',
        pontos: valores.slice(0, 5).map((v, i) => pt(i, v)).join(' '),
        pontosProj: [pt(4, valores[4]), pt(5, valores[5])].join(' '),
        anelGrad: 'conic-gradient(var(--color-accent-800) 0 ' + recPct + '%, var(--color-accent-400) 0 ' + (recPct + abPct) + '%, var(--color-neutral-300) 0)',
      },
      topAlunos: top,
      irCobranca: () => patchUi({ tab: 'cobranca' }),
      tabs: ([
        ['painel', 'Painel'],
        ['alunos', 'Alunos'],
        ['agenda', 'Agenda'],
        ['caixa', 'Caixa'],
        ['cobranca', 'Cobrar'],
      ] as const).map(([k, r]) => {
        const on = S.tab === k || (k === 'alunos' && S.tab === 'aluno');
        return {
          key: k,
          rotulo: r,
          cor: on ? 'var(--color-accent-800)' : 'var(--color-neutral-500)',
          marca: on ? 'var(--color-accent)' : 'var(--color-neutral-300)',
          ir: () => patchUi({ tab: k, alunoId: null }),
        };
      }),
      filtros,
      listaAlunos,
      busca: S.busca,
      setBusca: (v: string) => patchUi({ busca: v }),
      contagem: visiveis.length + ' de ' + domain.alunos.length + ' alunos · ' + ativos.length + ' gerando receita',
      aluno,
      voltar: () => patchUi({ tab: 'alunos', alunoId: null }),
      addExtra: () => {
        if (!a) return;
        const dia = dia2(28);
        db.insertSessaoExtra(a.id, dia, effectiveOwnerId || undefined)
          .then((nova) => patchAlunoLocal(a.id, (x) => ({ ...x, sessoes: [...x.sessoes, nova] })))
          .catch(reportError);
      },
      limparAjustes: () => {
        if (!a) return;
        patchAlunoLocal(a.id, (x) => ({
          ...x,
          ferias: 0,
          sessoes: x.sessoes.filter((s) => s.s !== 'extra').map((s) => ({ ...s, s: 'feita' })),
        }));
        db.limparAjustesRemote(a.id).catch(reportError);
      },
      abrirFerias: () => {
        if (!a) return;
        if (a.status === 'ferias') {
          patchAlunoLocal(a.id, (x) => ({ ...x, status: 'ativo', ferias: 0 }));
          db.setAlunoStatus(a.id, 'ativo', 0).catch(reportError);
          showToast(a.nome + ' voltou das férias.');
        } else {
          patchUi({ modal: 'ferias', feriasValor: String(Math.round(a.base / 2)) });
        }
      },
      abrirInativar: () => {
        if (!a) return;
        if (a.status === 'inativo') {
          patchAlunoLocal(a.id, (x) => ({ ...x, status: 'ativo' }));
          db.setAlunoStatus(a.id, 'ativo').catch(reportError);
          showToast(a.nome + ' reativado — histórico intacto.');
        } else {
          patchUi({ modal: 'inativar' });
        }
      },
      modalFerias: S.modal === 'ferias',
      modalInativar: S.modal === 'inativar',
      modalCobranca: S.modal === 'cobranca',
      modalAjustes: S.modal === 'ajustes',
      abrirAjustes: () => patchUi({ modal: 'ajustes' }),
      fecharModal: () => patchUi({ modal: null, editAlunoId: null, editAcademiaId: null, editDespesaId: null }),
      feriasValor: S.feriasValor,
      setFeriasValor: (v: string) => patchUi({ feriasValor: v.replace(/[^\d]/g, '') }),
      feriasPreview: a ? brl(Math.max(0, calcs.get(a.id)!.total - (parseInt(S.feriasValor || '0', 10) - calcs.get(a.id)!.ferias))) : '',
      presetsFerias: a
        ? [
            { rotulo: 'Metade', v: Math.round(a.base / 2) },
            { rotulo: 'Integral', v: a.base },
            { rotulo: '2 semanas', v: Math.round(a.base / 4) },
          ].map((p) => ({
            rotulo: p.rotulo,
            classe: 'tag ' + (parseInt(S.feriasValor || '0', 10) === p.v ? 'tag-accent' : 'tag-outline'),
            usar: () => patchUi({ feriasValor: String(p.v) }),
          }))
        : [],
      confirmarFerias: () => {
        if (!a) return;
        const v = parseInt(S.feriasValor || '0', 10);
        patchAlunoLocal(a.id, (x) => ({ ...x, status: 'ferias', ferias: v }));
        db.setAlunoStatus(a.id, 'ferias', v).catch(reportError);
        patchUi({ modal: null });
        showToast('Férias marcadas — ' + brl(v) + ' descontados de setembro.');
      },
      confirmarInativar: () => {
        if (!a) return;
        patchAlunoLocal(a.id, (x) => ({ ...x, status: 'inativo' }));
        db.setAlunoStatus(a.id, 'inativo').catch(reportError);
        patchUi({ modal: null });
        showToast(a.nome + ' inativado. Histórico preservado.');
      },
      semana: nomesSemana,
      diasMes,
      agendaView: S.agendaView,
      verSemana: () => patchUi({ agendaView: 'semana' }),
      verMes: () => patchUi({ agendaView: 'mes' }),
      semanaAtual,
      temSemanaAnterior,
      temSemanaSeguinte,
      semanaAnterior: () => patchUi({ diaSel: Math.max(1, selecionado - 7) }),
      semanaSeguinte: () => patchUi({ diaSel: Math.min(30, selecionado + 7) }),
      irParaHoje: () => patchUi({ diaSel: hojeDia }),
      resumoSemana: aulasSemana + (aulasSemana === 1 ? ' aula' : ' aulas') + ' essa semana · ' + diasLivresSemana + (diasLivresSemana === 1 ? ' dia livre' : ' dias livres'),
      dia: {
        titulo: String(selecionado).padStart(2, '0') + ' de setembro',
        total: brl(totalDia),
        aulas: aulasDoDia,
        rodape: aulasDoDia.length ? aulasDoDia.length + ' aula(s) neste dia — toque no status pra marcar feita/cancelada' : 'Dia livre — nada lançado.',
      },
      categorias: CATS.map((c) => ({
        nome: c,
        classe: 'tag ' + (S.despCat === c ? 'tag-accent' : 'tag-outline'),
        escolher: () => patchUi({ despCat: c }),
      })),
      despValor: S.despValor,
      despDesc: S.despDesc,
      setDespValor: (v: string) => patchUi({ despValor: v.replace(/[^\d]/g, '') }),
      setDespDesc: (v: string) => patchUi({ despDesc: v }),
      despPreview: S.despValor ? brl(parseInt(S.despValor, 10)) : 'despesa',
      addDespesa: () => {
        const v = parseInt(S.despValor || '0', 10);
        if (!v) {
          showToast('Coloca o valor da despesa.');
          return;
        }
        db.insertDespesa({ dia: '28/09', cat: S.despCat, desc: S.despDesc || S.despCat, valor: v }, effectiveOwnerId || undefined)
          .then((nova) => {
            setDomainRaw((s) => ({ ...s, despesas: [nova, ...s.despesas] }));
            patchUi({ despValor: '', despDesc: '' });
            showToast('Despesa de ' + brl(v) + ' lançada.');
          })
          .catch(reportError);
      },
      despesas: domain.despesas.map((d) => ({
        id: d.id,
        dia: d.dia,
        cat: d.cat,
        desc: d.desc,
        valor: brl(d.valor),
        editar: () => patchUi({ modal: 'despesaForm', editDespesaId: d.id }),
      })),
      academiasResumo,
      custoAcademiasFmt: brl(custoAcademiasTotal),
      modalAcademias: S.modal === 'academias',
      abrirAcademias: () => patchUi({ modal: 'academias' }),
      abrirNovaAcademia: () => patchUi({ modal: 'academiaForm', editAcademiaId: null }),
      modalAcademiaForm: S.modal === 'academiaForm',
      editandoAcademia,
      academiaModelos: ACADEMIA_MODELOS,
      fecharAcademiaForm: () => patchUi({ modal: 'academias', editAcademiaId: null }),
      salvarAcademia: (payload: AcademiaFormPayload) => {
        if (!payload.nome.trim()) {
          showToast('Dá um nome pra academia.');
          return;
        }
        if (S.editAcademiaId) {
          const id = S.editAcademiaId;
          setDomainRaw((s) => ({ ...s, academias: s.academias.map((ac) => (ac.id === id ? { ...ac, ...payload } : ac)) }));
          db.updateAcademiaRow(id, payload).catch(reportError);
          showToast(payload.nome + ' atualizada.');
          patchUi({ modal: 'academias', editAcademiaId: null });
        } else {
          db.insertAcademia(payload, effectiveOwnerId || undefined)
            .then((nova) => {
              setDomainRaw((s) => ({ ...s, academias: [...s.academias, nova] }));
              showToast(payload.nome + ' cadastrada.');
              patchUi({ modal: 'academias', editAcademiaId: null });
            })
            .catch(reportError);
        }
      },
      academiasOptions: domain.academias.map((ac) => ({ id: ac.id, nome: ac.nome })),
      modalAlunoForm: S.modal === 'alunoForm',
      editandoAluno,
      abrirNovoAluno: () => patchUi({ modal: 'alunoForm', editAlunoId: null }),
      abrirEditarAluno: (id: string) => patchUi({ modal: 'alunoForm', editAlunoId: id }),
      salvarAluno: (payload: AlunoFormPayload) => {
        if (!payload.nome.trim()) {
          showToast('Dá um nome pro aluno.');
          return;
        }
        const plano = payload.planoTipo === 'Pacote' ? 'Pacote ' + payload.aulasPrevistas + ' aulas' : 'Mensalidade fixa';
        const campos = {
          nome: payload.nome,
          inicial: iniciais(payload.nome),
          academiaId: payload.academiaId,
          plano,
          base: payload.valorPacote,
          previstas: payload.aulasPrevistas,
          horario: payload.horario,
          fone: payload.fone,
          desde: payload.desde,
        };
        if (S.editAlunoId) {
          const id = S.editAlunoId;
          patchAlunoLocal(id, (x) => ({ ...x, ...campos }));
          db.updateAlunoFields(id, campos).catch(reportError);
          showToast(payload.nome + ' atualizado.');
          patchUi({ modal: null, editAlunoId: null });
        } else {
          db.insertAluno(campos, criarSessoesPadrao(payload.aulasPrevistas).map((s) => ({ dia: s.dia, status: s.status })), effectiveOwnerId || undefined)
            .then((novo) => {
              setDomainRaw((s) => ({ ...s, alunos: [...s.alunos, novo] }));
              showToast(payload.nome + ' cadastrado.');
              patchUi({ modal: null, editAlunoId: null });
            })
            .catch(reportError);
        }
      },
      modalAlunoExcluir: S.modal === 'alunoExcluir',
      abrirExcluirAluno: () => a && patchUi({ modal: 'alunoExcluir' }),
      confirmarExcluirAluno: () => {
        if (!a) return;
        const nome = a.nome;
        const id = a.id;
        setDomainRaw((s) => ({ ...s, alunos: s.alunos.filter((x) => x.id !== id) }));
        db.deleteAlunoRow(id).catch(reportError);
        patchUi({ modal: null, tab: 'alunos', alunoId: null });
        showToast(nome + ' excluído de vez.');
      },
      avaliacoes: avaliacoesFmt,
      modalAvaliacaoForm: S.modal === 'avaliacaoForm',
      abrirNovaAvaliacao: () => patchUi({ modal: 'avaliacaoForm' }),
      salvarAvaliacao: (payload: AvaliacaoFormPayload) => {
        if (!a) return;
        db.insertAvaliacao(a.id, payload)
          .then((nova) => {
            setAvaliacoes((s) => [nova, ...s]);
            patchUi({ modal: null });
            showToast('Avaliação registrada.');
          })
          .catch(reportError);
      },
      modalDespesaForm: S.modal === 'despesaForm',
      editandoDespesa,
      salvarDespesa: (payload: DespesaFormPayload) => {
        if (!S.editDespesaId) return;
        const id = S.editDespesaId;
        setDomainRaw((s) => ({ ...s, despesas: s.despesas.map((d) => (d.id === id ? { ...d, ...payload } : d)) }));
        db.updateDespesaRow(id, payload).catch(reportError);
        patchUi({ modal: null, editDespesaId: null });
        showToast('Despesa atualizada.');
      },
      excluirDespesa: () => {
        if (!S.editDespesaId) return;
        const id = S.editDespesaId;
        setDomainRaw((s) => ({ ...s, despesas: s.despesas.filter((d) => d.id !== id) }));
        db.deleteDespesaRow(id).catch(reportError);
        patchUi({ modal: null, editDespesaId: null });
        showToast('Despesa excluída.');
      },
      cobranca: {
        frase: cobraveis.length ? brl(aberto + atrasado) + ' em aberto entre ' + cobraveis.length + ' alunos' : 'Nada em aberto',
        vazio: cobraveis.length === 0,
        lista: cobraveis.map((x) => {
          const c = calcs.get(x.id)!;
          const atrasadoX = x.pag === 'atrasado';
          return {
            id: x.id,
            nome: x.nome,
            valor: brl(c.total),
            detalhe: x.plano + ' · ' + (c.canceladas ? c.canceladas + ' cancelada(s) já descontada(s)' : 'pacote cheio'),
            borda: atrasadoX ? 'var(--color-accent)' : 'var(--color-divider)',
            tagClass: 'tag ' + (atrasadoX ? 'tag-accent' : x.pag === 'cobrado' ? 'tag-outline' : 'tag-neutral'),
            tagTexto: atrasadoX ? (x.atraso || 5) + ' dias' : x.pag === 'cobrado' ? 'cobrado hoje' : 'vence dia ' + String(prazo).padStart(2, '0'),
            botao: x.pag === 'cobrado' ? 'Cobrar de novo' : 'Cobrar',
            cobrar: () =>
              patchUi({
                modal: 'cobranca',
                cobrandoId: x.id,
                msg:
                  'Oi, ' + x.nome.split(' ')[0] + '! Fechei setembro em ' + brl(c.total) +
                  (c.canceladas ? ' (já com o desconto de ' + c.canceladas + ' aula(s) que não rolaram)' : '') +
                  '. Consegue acertar hoje? Chave Pix é meu celular. Bora manter o ritmo!',
              }),
            baixar: () => {
              patchAlunoLocal(x.id, (y) => ({ ...y, pag: 'pago' }));
              db.setAlunoPag(x.id, 'pago').catch(reportError);
              showToast(x.nome + ' pago. Boa!');
            },
          };
        }),
      },
      cobrando,
      msg: S.msg,
      setMsg: (v: string) => patchUi({ msg: v }),
      enviarCobranca: () => {
        if (S.cobrandoId == null) return;
        const id = S.cobrandoId;
        const digits = cobrando.fone.replace(/\D/g, '');
        if (!digits) {
          showToast('Cadastra o telefone de ' + cobrando.nome.split(' ')[0] + ' pra poder cobrar por WhatsApp.');
          return;
        }
        const comDdi = digits.length <= 11 ? '55' + digits : digits;
        window.open('https://wa.me/' + comDdi + '?text=' + encodeURIComponent(S.msg), '_blank');
        patchAlunoLocal(id, (x) => ({ ...x, pag: 'cobrado' }));
        db.setAlunoPag(id, 'cobrado').catch(reportError);
        patchUi({ modal: null });
        showToast('WhatsApp aberto pra ' + cobrando.nome.split(' ')[0] + '.');
      },
      toast: S.toast,
      temToast: !!S.toast,
      // settings (Ajustes) — sempre do dono efetivo (o personal sendo visualizado, se admin)
      grafico: domain.grafico,
      setGrafico: (v: DomainState['grafico']) => {
        if (!effectiveOwnerId) return;
        const owner = effectiveOwnerId;
        setAjustesPorUser((s) => ({ ...s, [owner]: { ...(s[owner] ?? db.AJUSTES_PADRAO), grafico: v } }));
        db.upsertAjustes(owner, { grafico: v }).catch(reportError);
      },
      metaMensal: domain.metaMensal,
      setMetaMensal: (v: number) => {
        if (!effectiveOwnerId) return;
        const owner = effectiveOwnerId;
        setAjustesPorUser((s) => ({ ...s, [owner]: { ...(s[owner] ?? db.AJUSTES_PADRAO), metaMensal: v } }));
        db.upsertAjustes(owner, { metaMensal: v }).catch(reportError);
      },
      diasParaAtraso: domain.diasParaAtraso,
      setDiasParaAtraso: (v: number) => {
        if (!effectiveOwnerId) return;
        const owner = effectiveOwnerId;
        setAjustesPorUser((s) => ({ ...s, [owner]: { ...(s[owner] ?? db.AJUSTES_PADRAO), diasParaAtraso: v } }));
        db.upsertAjustes(owner, { diasParaAtraso: v }).catch(reportError);
      },
      semanasPorMes: domain.semanasPorMes,
      setSemanasPorMes: (v: number) => {
        if (!effectiveOwnerId) return;
        const owner = effectiveOwnerId;
        setAjustesPorUser((s) => ({ ...s, [owner]: { ...(s[owner] ?? db.AJUSTES_PADRAO), semanasPorMes: v } }));
        db.upsertAjustes(owner, { semanasPorMes: v }).catch(reportError);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainRaw, ui, atual, patchUi, patchAlunoLocal, showToast, reportError, loading, userId, isAdmin, donoPorAluno, donoPorDespesa, donoPorAcademia, ajustesPorUser, profiles, avaliacoes]);

  return vm;
}

type AppVm = ReturnType<typeof useAppStateInternal>;

const AppContext = createContext<AppVm | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { session, isAdmin } = useAuth();
  const userId = session?.user.id;
  if (!userId) return null;
  return <AppProviderInner userId={userId} isAdmin={isAdmin}>{children}</AppProviderInner>;
}

function AppProviderInner({ userId, isAdmin, children }: { userId: string; isAdmin: boolean; children: ReactNode }) {
  const vm = useAppStateInternal(userId, isAdmin);
  return <AppContext.Provider value={vm}>{children}</AppContext.Provider>;
}

export function useApp(): AppVm {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export type { Despesa };
