import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { Academia, Aluno, Despesa, ModeloCobranca } from '../data/model';
import { ACADEMIA_MODELOS, CATS, dia2, iniciais } from '../data/seed';
import { brl, calc, diaVencimentoDe, mesAtual, mesSeguinte, nomeMesAbrev, nomeMesLongo } from '../lib/calc';
import { calcularAvaliacao, calcularRcq } from '../lib/avaliacaoCalc';
import * as db from '../lib/db';
import { useAuth } from './AuthContext';
import type { DomainState, UiState } from './types';
import type { Tone } from '../components/ui/tone';
import { IconeAgenda, IconeAlunos, IconeCaixa, IconeCobranca, IconePainel } from '../components/ui/icons';

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
  avaliacaoDetalheId: null,
  editAlunoId: null,
  editAcademiaId: null,
  editDespesaId: null,
  editExercicioId: null,
  treinoDetalheId: null,
};

interface DomainRaw {
  alunos: Aluno[];
  despesas: Despesa[];
  academias: Academia[];
  fechamentos: db.Fechamento[];
  exercicios: db.Exercicio[];
}

const emptyDomainRaw: DomainRaw = { alunos: [], despesas: [], academias: [], fechamentos: [], exercicios: [] };

export interface AlunoListItem {
  id: string;
  nome: string;
  inicial: string;
  avatarTone: Tone;
  sub: string;
  totalFmt: string;
  tagTone: Tone;
  tagTexto: string;
  pagTexto: string;
  pagTone: Tone;
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
  impactoPerderTexto: string | null;
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
  diasSemana: number[];
  aulasPrevistas: number;
  horaTexto: string;
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

function abrirWhatsApp(fone: string, msg: string): boolean {
  const digits = fone.replace(/\D/g, '');
  if (!digits) return false;
  const comDdi = digits.length <= 11 ? '55' + digits : digits;
  window.open('https://wa.me/' + comDdi + '?text=' + encodeURIComponent(msg), '_blank');
  return true;
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
  const [donoPorExercicio, setDonoPorExercicio] = useState<Record<string, string>>({});
  const [ajustesPorUser, setAjustesPorUser] = useState<Record<string, db.AjustesData>>({});
  const [profiles, setProfiles] = useState<db.ProfileRow[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<db.AvaliacaoRow[]>([]);
  const [treinosDoAluno, setTreinosDoAluno] = useState<db.Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [ui, setUi] = useState<UiState>(initialUi);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const patchUi = useCallback((p: Partial<UiState>) => {
    // Troca de tela ganha uma transição (fade + slide via View Transitions API,
    // ver .app-content em app.css) — patches que não mexem em `tab` continuam
    // instantâneos, é só a navegação entre telas que "desliza".
    const mudaTab = 'tab' in p;
    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (mudaTab && !reduzMovimento && document.startViewTransition) {
      document.startViewTransition(() => flushSync(() => setUi((s) => ({ ...s, ...p }))));
    } else {
      setUi((s) => ({ ...s, ...p }));
    }
  }, []);

  const showToast = useCallback((t: string, tone: Tone = 'ok') => {
    clearTimeout(toastTimer.current);
    patchUi({ toast: { msg: t, tone } });
    toastTimer.current = setTimeout(() => patchUi({ toast: null }), 2600);
    // Feedback tátil — curto e discreto no sucesso, um pouco mais insistente
    // no erro. iOS Safari não tem Vibration API; o guard evita quebrar lá.
    if ('vibrate' in navigator) navigator.vibrate(tone === 'danger' ? [20, 40, 20] : 12);
  }, [patchUi]);

  const reportError = useCallback((e: unknown) => {
    const msg = e instanceof Error ? e.message : 'Erro ao salvar';
    showToast('Não deu pra salvar — ' + msg, 'danger');
  }, [showToast]);

  // Contador de geração: cada chamada (login, troca de conta pelo admin, ou
  // um pull-to-refresh) invalida qualquer busca anterior ainda em voo — sem
  // isso, duas respostas podem chegar fora de ordem e a mais velha
  // sobrescrever a mais nova.
  const geracaoRef = useRef(0);

  // `mostrarCarregando` fica false no pull-to-refresh: a tela já tem dados,
  // não faz sentido voltar pro skeleton — só o gesto de puxar mostra que
  // está buscando de novo.
  const carregarDomain = useCallback((mostrarCarregando: boolean) => {
    const minhaGeracao = ++geracaoRef.current;
    if (mostrarCarregando) setLoading(true);
    return Promise.all([db.fetchDomain(userId), db.fetchExercicios()])
      .then(([remote, exerciciosRemote]) => {
        if (geracaoRef.current !== minhaGeracao) return;
        setDomainRaw({
          alunos: remote.alunos,
          despesas: remote.despesas,
          academias: remote.academias,
          fechamentos: remote.fechamentos,
          exercicios: exerciciosRemote.exercicios,
        });
        setDonoPorAluno(remote.donoPorAluno);
        setDonoPorDespesa(remote.donoPorDespesa);
        setDonoPorAcademia(remote.donoPorAcademia);
        setDonoPorExercicio(exerciciosRemote.donoPorExercicio);
        setAjustesPorUser(remote.ajustesPorUser);
      })
      .catch((e) => {
        if (geracaoRef.current === minhaGeracao) reportError(e);
      })
      .finally(() => {
        if (mostrarCarregando && geracaoRef.current === minhaGeracao) setLoading(false);
      });
  }, [userId, reportError]);

  useEffect(() => {
    carregarDomain(true);
  }, [userId, carregarDomain]);

  const recarregar = useCallback(() => carregarDomain(false), [carregarDomain]);

  // Histórico do navegador pros modais — um único ponto de controle pra
  // toda a árvore de modais (não um push/back por Modal individual, que
  // causa corrida quando um modal-lista abre um modal-formulário por cima
  // na mesma renderização). Só reage a "existe modal aberto" virando
  // verdadeiro/falso — trocar de um modal pro outro sem passar por "nenhum
  // modal" não mexe no histórico.
  const historyConsumidoRef = useRef(true);
  useEffect(() => {
    if (ui.modal !== null) {
      window.history.pushState({ impulsaModal: true }, '');
      historyConsumidoRef.current = false;
      const aoVoltar = () => {
        historyConsumidoRef.current = true;
        patchUi({ modal: null, editAlunoId: null, editAcademiaId: null, editDespesaId: null, editExercicioId: null, treinoDetalheId: null });
      };
      window.addEventListener('popstate', aoVoltar);
      return () => window.removeEventListener('popstate', aoVoltar);
    }
    if (!historyConsumidoRef.current) {
      historyConsumidoRef.current = true;
      window.history.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.modal !== null]);

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

  // Atualiza a tela na hora e só volta atrás se o Supabase recusar — em vez
  // de esperar o servidor confirmar pra então refletir a mudança. É o padrão
  // que as ações de toque rápido (pago, sessão, férias, inativar) já usavam
  // pela metade (atualizavam local mas nunca desfaziam no erro); agora
  // desfazem, com um toast explicando o que aconteceu.
  const patchAlunoOtimista = useCallback(
    (id: string, aplicar: (a: Aluno) => Aluno, persistir: () => Promise<void>, msgSucesso?: string) => {
      const anterior = domainRaw.alunos.find((a) => a.id === id);
      patchAlunoLocal(id, aplicar);
      persistir()
        .then(() => {
          if (msgSucesso) showToast(msgSucesso, 'ok');
        })
        .catch((e) => {
          if (anterior) patchAlunoLocal(id, () => anterior);
          const msg = e instanceof Error ? e.message : 'Erro ao salvar';
          showToast('Não deu pra salvar, desfiz a alteração — ' + msg, 'danger');
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [domainRaw],
  );

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

  const recarregarTreinos = useCallback(() => {
    if (!atual) return;
    db.fetchTreinosDoAluno(atual.id).then(setTreinosDoAluno).catch(reportError);
  }, [atual, reportError]);

  useEffect(() => {
    if (!atual) {
      setTreinosDoAluno([]);
      return;
    }
    let ativo = true;
    db.fetchTreinosDoAluno(atual.id)
      .then((rows) => ativo && setTreinosDoAluno(rows))
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
          fone: p.fone,
          setFone: (v: string) => {
            setProfiles((s) => s.map((x) => (x.id === p.id ? { ...x, fone: v } : x)));
            db.updateProfileBilling(p.id, { fone: v }).catch(reportError);
          },
          mensalidadeValor: p.mensalidade_valor,
          setMensalidadeValor: (v: number) => {
            setProfiles((s) => s.map((x) => (x.id === p.id ? { ...x, mensalidade_valor: v } : x)));
            db.updateProfileBilling(p.id, { mensalidadeValor: v }).catch(reportError);
          },
          mensalidadeStatus: p.mensalidade_status,
          mensalidadeTagClass: 'tag ' + (p.mensalidade_status === 'atrasado' ? 'tag-accent' : p.mensalidade_status === 'pago' ? 'tag-neutral' : p.mensalidade_status === 'cobrado' ? 'tag-outline' : 'tag-neutral'),
          mensalidadeTagTexto: p.mensalidade_status === 'pago' ? 'pago' : p.mensalidade_status === 'atrasado' ? 'atrasado' : p.mensalidade_status === 'cobrado' ? 'cobrado' : 'em aberto',
          cobrarMensalidade: () => {
            const nome = (p.nome || p.email).split(' ')[0];
            const msg = 'Oi, ' + nome + '! Passando pra lembrar da mensalidade do app: ' + brl(p.mensalidade_valor) + '. Consegue acertar?';
            if (!abrirWhatsApp(p.fone, msg)) {
              showToast('Cadastra o telefone de ' + nome + ' pra poder cobrar por WhatsApp.');
              return;
            }
            setProfiles((s) => s.map((x) => (x.id === p.id ? { ...x, mensalidade_status: 'cobrado' } : x)));
            db.updateProfileBilling(p.id, { mensalidadeStatus: 'cobrado' }).catch(reportError);
            showToast('WhatsApp aberto pra ' + nome + '.');
          },
          receberMensalidade: () => {
            setProfiles((s) => s.map((x) => (x.id === p.id ? { ...x, mensalidade_status: 'pago' } : x)));
            db.updateProfileBilling(p.id, { mensalidadeStatus: 'pago' }).catch(reportError);
            showToast((p.nome || p.email).split(' ')[0] + ' pago. Boa!');
          },
        };
      });
    const meta = domain.metaMensal;
    const prazo = domain.diasParaAtraso;
    const vizNome = domain.grafico;
    const semanasPorMes = domain.semanasPorMes;
    const ativos = domain.alunos.filter((a) => a.status !== 'inativo');
    const calcs = new Map(domain.alunos.map((a) => [a.id, calc(a)]));
    const fechamentosDoOwner = effectiveOwnerId ? domainRaw.fechamentos.filter((f) => donoPorAluno[f.alunoId] === effectiveOwnerId) : [];
    const exerciciosDoOwner = effectiveOwnerId ? domainRaw.exercicios.filter((e) => donoPorExercicio[e.id] === effectiveOwnerId) : [];
    const exercicioPorId = new Map(exerciciosDoOwner.map((e) => [e.id, e]));
    const mesAtualStr = mesAtual();
    const mesAtualNome = nomeMesLongo(mesAtualStr);
    const mesAtualNomeCap = mesAtualNome.charAt(0).toUpperCase() + mesAtualNome.slice(1);
    const mesAtualNomeCapAno = mesAtualNomeCap + ' ' + mesAtualStr.slice(0, 4);

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

    // Quando o dinheiro entra de verdade, não só quanto — separa os alunos
    // ativos em faixas do dia de vencimento. Cadastro antigo sem data
    // completa (ver diaVencimentoDe) cai numa faixa "sem data" à parte,
    // em vez de ser descartado da conta.
    const vencimentoFaixas = (() => {
      const faixas = [
        { rotulo: '1–10', min: 1, max: 10, qtd: 0, total: 0 },
        { rotulo: '11–20', min: 11, max: 20, qtd: 0, total: 0 },
        { rotulo: '21–31', min: 21, max: 31, qtd: 0, total: 0 },
      ];
      let semData = { qtd: 0, total: 0 };
      for (const al of ativos) {
        const valor = calcs.get(al.id)!.total;
        const dia = diaVencimentoDe(al.desde);
        if (dia == null) {
          semData = { qtd: semData.qtd + 1, total: semData.total + valor };
          continue;
        }
        const faixa = faixas.find((f) => dia >= f.min && dia <= f.max);
        if (faixa) {
          faixa.qtd += 1;
          faixa.total += valor;
        }
      }
      const todas = semData.qtd > 0 ? [...faixas, { rotulo: 'sem data', min: 0, max: 0, ...semData }] : faixas;
      const maiorTotal = Math.max(1, ...todas.map((f) => f.total));
      return todas.map((f) => ({ rotulo: f.rotulo, qtd: f.qtd, totalFmt: brl(f.total), pct: Math.round((f.total / maiorTotal) * 100) }));
    })();

    // Só entra no gráfico o que foi de verdade fechado (tabela `fechamentos`)
    // — sem isso, mostra só o mês corrente ao vivo + a projeção. Vai
    // enchendo aos poucos conforme "Fechar o mês" é usado.
    const totalPorMesFechado = new Map<string, number>();
    for (const f of fechamentosDoOwner) {
      totalPorMesFechado.set(f.mes, (totalPorMesFechado.get(f.mes) ?? 0) + f.total);
    }
    const mesesFechadosOrdenados = [...totalPorMesFechado.keys()].filter((m) => m < mesAtualStr).sort().slice(-4);
    const historico = mesesFechadosOrdenados.map((m) => totalPorMesFechado.get(m)!);
    const mesProjetado = mesSeguinte(mesAtualStr);
    const valores = [...historico, previsto, Math.round(previsto * 1.06)];
    const nomes = [...mesesFechadosOrdenados.map(nomeMesAbrev), nomeMesAbrev(mesAtualStr), nomeMesAbrev(mesProjetado)];
    const mesAtualIdx = historico.length;
    const projIdx = historico.length + 1;
    const maxV = Math.max(...valores, meta, despTotal);
    const meses = valores.map((v, i) => ({
      nome: nomes[i],
      rotulo: (v / 1000).toFixed(1) + 'k',
      h: Math.round((v / maxV) * 88),
      cor: i === mesAtualIdx ? 'var(--color-accent)' : i === projIdx ? 'transparent' : 'var(--color-accent-200)',
      borda: i === projIdx ? 'var(--color-accent-400)' : i === mesAtualIdx ? 'var(--color-accent)' : 'var(--color-accent-300)',
      texto: i === mesAtualIdx ? 'var(--color-accent-800)' : 'var(--color-neutral-600)',
      despesaH: i === mesAtualIdx ? Math.round((despTotal / maxV) * 88) : null,
    }));
    const metaLinhaH = Math.round((meta / maxV) * 88);
    const pt = (i: number, v: number) => i * (300 / (valores.length - 1)) + ',' + (108 - (v / maxV) * 100).toFixed(1);
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
    // Vencimento é por aluno (dia extraído de `desde`) desde que a Débora
    // aprovou isso — cadastro antigo sem data completa ainda não tem dia
    // próprio, então cai no genérico da config global até ser editado.
    const diaVencimentoTexto = (a: Aluno) => String(diaVencimentoDe(a.desde) ?? prazo).padStart(2, '0');
    const pagDe = (a: Aluno) =>
      a.pag === 'pago'
        ? { pagTexto: 'pago', pagCor: 'var(--color-neutral-600)' }
        : a.pag === 'atrasado'
          ? { pagTexto: (a.atraso || prazo) + ' dias em atraso', pagCor: 'var(--color-accent-800)' }
          : a.pag === 'cobrado'
            ? { pagTexto: 'cobrado hoje', pagCor: 'var(--color-accent-700)' }
            : { pagTexto: 'vence dia ' + diaVencimentoTexto(a), pagCor: 'var(--color-neutral-600)' };

    const visiveis = domain.alunos.filter((a) => {
      const okF =
        S.filtro === 'Todos' ||
        (S.filtro === 'Ativos' && a.status === 'ativo') ||
        (S.filtro === 'Férias' && a.status === 'ferias') ||
        (S.filtro === 'Inativos' && a.status === 'inativo');
      const okB = !S.busca || a.nome.toLowerCase().includes(S.busca.toLowerCase());
      return okF && okB;
    });
    const tagToneDe = (a: Aluno): Tone => (a.status === 'ferias' ? 'outline' : a.status === 'inativo' ? 'neutral' : 'brand');
    const pagToneDe = (a: Aluno): Tone => (a.pag === 'atrasado' ? 'danger' : a.pag === 'cobrado' ? 'brand' : 'muted');
    const listaAlunos: AlunoListItem[] = visiveis.map((a) => {
      const c = calcs.get(a.id)!;
      const nomeAcademia = academiaNome(a.academiaId);
      return {
        id: a.id,
        nome: a.nome,
        inicial: a.inicial,
        avatarTone: a.status === 'inativo' ? 'disabled' : 'brand',
        sub: a.plano + ' · ' + a.horario + (nomeAcademia ? ' · ' + nomeAcademia : ''),
        totalFmt: brl(c.total),
        tagTone: tagToneDe(a),
        tagTexto: tagDe(a).tagTexto,
        pagTexto: pagDe(a).pagTexto,
        pagTone: pagToneDe(a),
        abrir: () => patchUi({ tab: 'aluno', alunoId: a.id }),
      };
    });

    const formatarItemTreino = (it: db.TreinoItem) => {
      const ex = exercicioPorId.get(it.exercicioId);
      const partes: string[] = [];
      if (it.series != null) partes.push(it.series + (it.repeticoes ? 'x ' + it.repeticoes : 'x'));
      else if (it.repeticoes) partes.push(it.repeticoes);
      if (it.carga != null) partes.push(it.carga.toLocaleString('pt-BR') + ' kg');
      if (it.descanso) partes.push('descanso ' + it.descanso);
      return {
        id: it.id,
        exercicioNome: ex?.nome ?? '(exercício removido da biblioteca)',
        grupoMuscular: ex?.grupoMuscular ?? '',
        resumo: partes.join(' · '),
        observacoes: it.observacoes,
      };
    };
    const treinosVm = treinosDoAluno.map((t) => ({
      id: t.id,
      nome: t.nome || 'Treino',
      status: t.status,
      dataFmt: new Date(t.createdAt).toLocaleDateString('pt-BR'),
      dias: t.dias.map((d) => ({ id: d.id, nome: d.nome, itens: d.itens.map(formatarItemTreino) })),
      abrirDetalhe: () => patchUi({ modal: 'treinoDetalhe', treinoDetalheId: t.id }),
    }));
    const treinoAtivo = treinosVm.find((t) => t.status === 'ativo') ?? null;
    const treinosArquivados = treinosVm.filter((t) => t.status === 'arquivado');

    const a = atual;
    let aluno: AlunoDetalheVm | undefined;
    if (a) {
      const c = calcs.get(a.id)!;
      const fechamentosDesteAluno = fechamentosDoOwner.filter((f) => f.alunoId === a.id).sort((x, y) => y.mes.localeCompare(x.mes)).slice(0, 4);
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
          patchAlunoOtimista(a.id, (x) => ({ ...x, pag: 'pago' }), () => db.setAlunoPag(a.id, 'pago'), 'Pagamento de ' + a.nome + ' registrado.');
        },
        media: fechamentosDesteAluno.length ? brl(fechamentosDesteAluno.reduce((t, f) => t + f.total, 0) / fechamentosDesteAluno.length) : '',
        impactoPerderTexto:
          c.total > 0
            ? 'Sem ' + a.nome.split(' ')[0] + ', o faturamento do mês cai de ' + brl(previsto) + ' para ' + brl(previsto - c.total) + ' (−' + Math.round((c.total / previsto) * 100) + '%).'
            : null,
        historico: fechamentosDesteAluno.map((f) => ({
          mes: nomeMesLongo(f.mes),
          nota: f.canceladas > 0 ? f.canceladas + (f.canceladas === 1 ? ' cancelada' : ' canceladas') : f.extras > 0 ? '+' + f.extras + (f.extras === 1 ? ' extra' : ' extras') : f.feriasValor > 0 ? 'férias' : 'pacote cheio',
          valor: brl(f.total),
        })),
        sessoes: a.sessoes.map((s) => ({
          id: s.id,
          dia: s.dia.slice(0, 2),
          rotulo: s.s === 'cancelada' ? 'cancel.' : s.s === 'extra' ? 'extra' : 'ok',
          borda: s.s === 'cancelada' ? 'var(--color-neutral-400)' : s.s === 'extra' ? 'var(--color-accent-800)' : 'var(--color-divider)',
          fundo: s.s === 'extra' ? 'var(--color-accent-800)' : s.s === 'cancelada' ? 'var(--color-neutral-200)' : 'transparent',
          cor: s.s === 'extra' ? 'var(--color-bg)' : s.s === 'cancelada' ? 'var(--color-neutral-600)' : 'var(--color-text)',
          toggle: () => {
            const novo = s.s === 'feita' ? 'cancelada' : 'feita';
            patchAlunoOtimista(
              a.id,
              (x) => ({ ...x, sessoes: x.sessoes.map((y) => (y.id === s.id ? { ...y, s: novo } : y)) }),
              () => db.setSessaoStatus(s.id, novo),
            );
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
      rotulo: string;
      valor: number | string;
      borda: string;
      fundo: string;
      cor: string;
      cursor: string;
      selecionar: () => void;
      key: string;
    }[] = [];
    for (let i = 0; i < 2; i++) {
      diasMes.push({ n: '', rotulo: '', valor: '', borda: 'transparent', fundo: 'transparent', cor: 'transparent', cursor: 'default', selecionar: () => {}, key: 'pad' + i });
    }
    for (let n = 1; n <= 30; n++) {
      const v = diasComAula[n] || 0;
      const sel = n === selecionado;
      diasMes.push({
        n,
        rotulo: nomesSemana[diaSemanaDe(n)],
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
            patchAlunoOtimista(
              x.id,
              (a) => ({ ...a, sessoes: a.sessoes.map((y) => (y.id === s.id ? { ...y, s: novo } : y)) }),
              () => db.setSessaoStatus(s.id, novo),
            );
          },
        });
      }),
    );
    const totalDia = aulasDoDia.reduce((t, s) => t + (s.valor.startsWith('−') ? 0 : parseFloat(s.valor.replace(/[^\d]/g, ''))), 0);

    const academiasResumo = custosAcademias.map(({ academia: ac, nAtivos, base: baseC, desloc, total }) => {
      const receita = ativos.filter((al) => al.academiaId === ac.id).reduce((t, al) => t + calcs.get(al.id)!.total, 0);
      return {
      id: ac.id,
      nome: ac.nome,
      modeloTexto: ac.modelo === 'mensal_fixo' ? 'Mensal fixo' : 'Por aluno',
      valorCobradoFmt: brl(ac.valorCobrado),
      deslocTexto: ac.custoPorTrecho > 0 ? brl(ac.custoPorTrecho) + ' × ' + ac.viagensPorSemana + '/sem' : '—',
      nAtivos,
      baseFmt: brl(baseC),
      deslocFmt: brl(desloc),
      custoMensalFmt: brl(total),
      receitaFmt: brl(receita),
      lucroFmt: brl(receita - total),
      lucroPositivo: receita - total >= 0,
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
    };
    });

    const editandoAcademia = domain.academias.find((ac) => ac.id === S.editAcademiaId) ?? null;
    const editandoAluno = domain.alunos.find((al) => al.id === S.editAlunoId) ?? null;
    const editandoDespesa = domain.despesas.find((d) => d.id === S.editDespesaId) ?? null;

    const campo = (label: string, v: number | null, unidade: string) => (v != null ? { label, valor: v.toLocaleString('pt-BR') + ' ' + unidade } : null);
    const avaliacoesFmt = avaliacoes
      .map((r) => {
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
        const percentualGorduraFmt = res.percentualGordura != null ? res.percentualGordura.toFixed(1) + '%' : '—';
        const massaMagraFmt = res.massaMagra != null ? res.massaMagra.toFixed(1) + ' kg' : '—';
        const rcqFmt = rcq ? rcq.valor.toFixed(2) + ' (' + rcq.classe + ')' : null;
        const dobras = [
          campo('Peitoral', r.dobra_peitoral, 'mm'),
          campo('Axilar média', r.dobra_axilar, 'mm'),
          campo('Tríceps', r.dobra_triceps, 'mm'),
          campo('Subescapular', r.dobra_subescapular, 'mm'),
          campo('Abdominal', r.dobra_abdominal, 'mm'),
          campo('Suprailíaca', r.dobra_suprailiaca, 'mm'),
          campo('Coxa', r.dobra_coxa, 'mm'),
          campo('Bíceps', r.dobra_biceps, 'mm'),
          campo('Panturrilha', r.dobra_panturrilha, 'mm'),
        ].filter((c): c is { label: string; valor: string } => c != null);
        const perimetria = [
          campo('Pescoço', r.perim_pescoco, 'cm'),
          campo('Tórax', r.perim_torax, 'cm'),
          campo('Cintura', r.perim_cintura, 'cm'),
          campo('Abdômen', r.perim_abdomen, 'cm'),
          campo('Quadril', r.perim_quadril, 'cm'),
        ].filter((c): c is { label: string; valor: string } => c != null);
        return {
          id: r.id,
          data: r.data,
          peso: r.peso,
          pesoFmt: r.peso.toLocaleString('pt-BR') + ' kg',
          bruto: {
            peso: r.peso,
            imc: res.imc,
            percentualGordura: res.percentualGordura,
            massaMagra: res.massaMagra,
            dobraPeitoral: r.dobra_peitoral,
            dobraAxilar: r.dobra_axilar,
            dobraTriceps: r.dobra_triceps,
            dobraSubescapular: r.dobra_subescapular,
            dobraAbdominal: r.dobra_abdominal,
            dobraSuprailiaca: r.dobra_suprailiaca,
            dobraCoxa: r.dobra_coxa,
            dobraBiceps: r.dobra_biceps,
            dobraPanturrilha: r.dobra_panturrilha,
            perimPescoco: r.perim_pescoco,
            perimTorax: r.perim_torax,
            perimCintura: r.perim_cintura,
            perimAbdomen: r.perim_abdomen,
            perimQuadril: r.perim_quadril,
          },
          imc: res.imc,
          imcFmt: res.imc.toFixed(1),
          imcClasse: res.imcClasse,
          risco: res.risco,
          temDobras: res.temDobras,
          percentualGordura: res.percentualGordura,
          percentualGorduraFmt,
          massaMagraFmt,
          rcqFmt,
          observacoes: r.observacoes,
          excluir: () => {
            setAvaliacoes((s) => s.filter((x) => x.id !== r.id));
            db.deleteAvaliacaoRow(r.id).catch(reportError);
            showToast('Avaliação excluída.');
          },
          abrirDetalhe: () => patchUi({ modal: 'avaliacaoDetalhe', avaliacaoDetalheId: r.id }),
          pdfDados: {
            alunoNome: a?.nome ?? '',
            data: r.data,
            resumoLinha: r.idade + ' anos · ' + (r.sexo === 'M' ? 'masculino' : 'feminino'),
            imcFmt: res.imc.toFixed(1),
            imcClasse: res.imcClasse,
            risco: res.risco,
            percentualGorduraFmt,
            pesoGordoFmt: res.pesoGordo != null ? res.pesoGordo.toFixed(1) + ' kg' : '—',
            massaMagraFmt,
            rcqFmt,
            gerais: [
              { label: 'Peso', valor: r.peso.toLocaleString('pt-BR') + ' kg' },
              { label: 'Estatura', valor: Math.round(r.estatura * 100) + ' cm' },
              { label: 'Idade', valor: r.idade + ' anos' },
            ],
            dobras,
            perimetria,
            observacoes: r.observacoes,
          },
        };
      });
    const avaliacoesEvolucao = [...avaliacoesFmt].reverse();

    return {
      loading,
      recarregar,
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
        legenda: vizNome === 'Anel de recebimento' ? 'previsto ' + brl(previsto) : nomeMesAbrev(mesProjetado) + ' projetado',
        barras: vizNome === 'Barras mensais',
        linha: vizNome === 'Linha de caixa',
        anel: vizNome === 'Anel de recebimento',
        metaLinhaH,
        despesaAtualFmt: brl(despTotal),
        pontos: valores.slice(0, -1).map((v, i) => pt(i, v)).join(' '),
        pontosProj: [pt(mesAtualIdx, valores[mesAtualIdx]), pt(projIdx, valores[projIdx])].join(' '),
        anelGrad: 'conic-gradient(var(--color-accent-800) 0 ' + recPct + '%, var(--color-accent-400) 0 ' + (recPct + abPct) + '%, var(--color-neutral-300) 0)',
      },
      topAlunos: top,
      mesAtualNome,
      mesAtualNomeCap,
      mesAtualNomeCapAno,
      vencimentoFaixas,
      irCobranca: () => patchUi({ tab: 'cobranca' }),
      tabs: ([
        ['painel', 'Painel', IconePainel],
        ['alunos', 'Alunos', IconeAlunos],
        ['agenda', 'Agenda', IconeAgenda],
        ['caixa', 'Caixa', IconeCaixa],
        ['cobranca', 'Cobrar', IconeCobranca],
      ] as const).map(([k, r, Icone]) => {
        const on = S.tab === k || (k === 'alunos' && S.tab === 'aluno');
        return {
          key: k,
          rotulo: r,
          Icone,
          ativo: on,
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
          patchAlunoOtimista(a.id, (x) => ({ ...x, status: 'ativo', ferias: 0 }), () => db.setAlunoStatus(a.id, 'ativo', 0), a.nome + ' voltou das férias.');
        } else {
          patchUi({ modal: 'ferias', feriasValor: String(Math.round(a.base / 2)) });
        }
      },
      abrirInativar: () => {
        if (!a) return;
        if (a.status === 'inativo') {
          patchAlunoOtimista(a.id, (x) => ({ ...x, status: 'ativo' }), () => db.setAlunoStatus(a.id, 'ativo'), a.nome + ' reativado — histórico intacto.');
        } else {
          patchUi({ modal: 'inativar' });
        }
      },
      modalFerias: S.modal === 'ferias',
      modalInativar: S.modal === 'inativar',
      modalCobranca: S.modal === 'cobranca',
      modalAjustes: S.modal === 'ajustes',
      abrirAjustes: () => patchUi({ modal: 'ajustes' }),
      modalFecharMes: S.modal === 'fecharMes',
      abrirFecharMes: () => ativos.length > 0 && patchUi({ modal: 'fecharMes' }),
      fecharMesQtdAlunos: ativos.length,
      fecharMesTotalFmt: brl(previsto),
      fecharMesNome: nomeMesLongo(mesAtualStr),
      confirmarFecharMes: () => {
        if (!effectiveOwnerId || ativos.length === 0) return;
        const mes = mesAtualStr;
        const rows: db.FechamentoInsertPayload[] = ativos.map((al) => {
          const c = calcs.get(al.id)!;
          return { alunoId: al.id, mes, base: al.base, total: c.total, canceladas: c.canceladas, extras: c.extras, feriasValor: c.ferias };
        });
        const ids = ativos.map((al) => al.id);
        db.fecharMesRemote(rows, ids, effectiveOwnerId)
          .then((novos) => {
            setDomainRaw((s) => ({
              ...s,
              alunos: s.alunos.map((al) =>
                ids.includes(al.id)
                  ? { ...al, ferias: 0, sessoes: al.sessoes.filter((sx) => sx.s !== 'extra').map((sx) => ({ ...sx, s: sx.s === 'cancelada' ? 'feita' : sx.s })) }
                  : al,
              ),
              fechamentos: [...s.fechamentos.filter((f) => !(f.mes === mes && ids.includes(f.alunoId))), ...novos],
            }));
            patchUi({ modal: null });
            showToast('Mês fechado — ' + ids.length + ' aluno(s), ' + brl(rows.reduce((t, r) => t + r.total, 0)) + ' registrados.');
          })
          .catch(reportError);
      },
      fecharModal: () => patchUi({ modal: null, editAlunoId: null, editAcademiaId: null, editDespesaId: null, editExercicioId: null, treinoDetalheId: null }),
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
        patchAlunoOtimista(a.id, (x) => ({ ...x, status: 'ferias', ferias: v }), () => db.setAlunoStatus(a.id, 'ferias', v), 'Férias marcadas — ' + brl(v) + ' descontados de ' + mesAtualNome + '.');
        patchUi({ modal: null });
      },
      confirmarInativar: () => {
        if (!a) return;
        patchAlunoOtimista(a.id, (x) => ({ ...x, status: 'inativo' }), () => db.setAlunoStatus(a.id, 'inativo'), a.nome + ' inativado. Histórico preservado.');
        patchUi({ modal: null });
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
        titulo: String(selecionado).padStart(2, '0') + ' de ' + mesAtualNome,
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
      salvarAluno: (payload: AlunoFormPayload): Promise<void> => {
        if (!payload.nome.trim()) {
          showToast('Dá um nome pro aluno.');
          return Promise.resolve();
        }
        if (S.editAlunoId) {
          const id = S.editAlunoId;
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
          patchAlunoLocal(id, (x) => ({ ...x, ...campos }));
          db.updateAlunoFields(id, campos).catch(reportError);
          showToast(payload.nome + ' atualizado.');
          patchUi({ modal: null, editAlunoId: null });
          return Promise.resolve();
        } else {
          if (payload.diasSemana.length === 0) {
            showToast('Marca pelo menos um dia da semana das aulas.');
            return Promise.resolve();
          }
          const diasGerados: number[] = [];
          for (let n = 1; n <= 30; n++) if (payload.diasSemana.includes(diaSemanaDe(n))) diasGerados.push(n);
          const previstas = Math.max(1, diasGerados.length);
          const diasOrdenados = [...payload.diasSemana].sort((x, y) => x - y);
          const nomesDias = diasOrdenados.map((d) => nomesSemana[d].charAt(0).toUpperCase() + nomesSemana[d].slice(1)).join('/');
          const horario = nomesDias + (payload.horaTexto.trim() ? ' · ' + payload.horaTexto.trim() : '');
          const plano = payload.planoTipo === 'Pacote' ? 'Pacote ' + previstas + ' aulas' : 'Mensalidade fixa';
          const campos = {
            nome: payload.nome,
            inicial: iniciais(payload.nome),
            academiaId: payload.academiaId,
            plano,
            base: payload.valorPacote,
            previstas,
            horario,
            fone: payload.fone,
            desde: payload.desde,
          };
          return db
            .insertAluno(campos, diasGerados.map((n) => ({ dia: dia2(n), status: 'feita' })), effectiveOwnerId || undefined)
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
      avaliacoesEvolucao,
      modalAvaliacaoForm: S.modal === 'avaliacaoForm',
      abrirNovaAvaliacao: () => patchUi({ modal: 'avaliacaoForm' }),
      modalAvaliacaoDetalhe: S.modal === 'avaliacaoDetalhe',
      avaliacaoDetalheAtual: avaliacoesFmt.find((av) => av.id === S.avaliacaoDetalheId) ?? null,
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
      exerciciosResumo: exerciciosDoOwner.map((e) => ({
        ...e,
        editar: () => patchUi({ modal: 'exercicioForm', editExercicioId: e.id }),
        excluir: () => {
          setDomainRaw((s) => ({ ...s, exercicios: s.exercicios.filter((x) => x.id !== e.id) }));
          db.deleteExercicioRow(e.id).catch(reportError);
          showToast(e.nome + ' excluído da biblioteca.');
        },
      })),
      exerciciosOptions: exerciciosDoOwner.map((e) => ({ id: e.id, nome: e.nome, grupoMuscular: e.grupoMuscular })),
      modalExercicios: S.modal === 'exercicios',
      abrirExercicios: () => patchUi({ modal: 'exercicios' }),
      abrirNovoExercicio: () => patchUi({ modal: 'exercicioForm', editExercicioId: null }),
      modalExercicioForm: S.modal === 'exercicioForm',
      editandoExercicio: exerciciosDoOwner.find((e) => e.id === S.editExercicioId) ?? null,
      fecharExercicioForm: () => patchUi({ modal: 'exercicios', editExercicioId: null }),
      salvarExercicio: (payload: db.ExercicioPayload) => {
        if (!payload.nome.trim()) {
          showToast('Dá um nome pro exercício.');
          return;
        }
        if (S.editExercicioId) {
          const id = S.editExercicioId;
          setDomainRaw((s) => ({ ...s, exercicios: s.exercicios.map((e) => (e.id === id ? { ...e, ...payload } : e)) }));
          db.updateExercicioRow(id, payload).catch(reportError);
          showToast(payload.nome + ' atualizado.');
          patchUi({ modal: 'exercicios', editExercicioId: null });
        } else {
          db.insertExercicio(payload, effectiveOwnerId || undefined)
            .then((novo) => {
              setDomainRaw((s) => ({ ...s, exercicios: [...s.exercicios, novo] }));
              showToast(payload.nome + ' cadastrado na biblioteca.');
              patchUi({ modal: 'exercicios', editExercicioId: null });
            })
            .catch(reportError);
        }
      },
      treinoAtivo,
      treinosArquivados,
      modalTreinoForm: S.modal === 'treinoForm',
      abrirMontarTreino: () => a && patchUi({ modal: 'treinoForm' }),
      salvarNovoTreino: (payload: db.TreinoPayload) => {
        if (!a) return;
        if (!payload.dias.length || payload.dias.every((d) => d.itens.length === 0)) {
          showToast('Adiciona pelo menos um exercício no treino.');
          return;
        }
        db.salvarTreino(a.id, payload, effectiveOwnerId || undefined)
          .then(() => {
            recarregarTreinos();
            patchUi({ modal: null });
            showToast('Treino montado — o anterior foi pro histórico.');
          })
          .catch(reportError);
      },
      modalTreinoDetalhe: S.modal === 'treinoDetalhe',
      treinoDetalheAtual: treinosVm.find((t) => t.id === S.treinoDetalheId) ?? null,
      abrirTreinoDetalhe: (id: string) => patchUi({ modal: 'treinoDetalhe', treinoDetalheId: id }),
      excluirTreino: (id: string) => {
        db.deleteTreinoRow(id)
          .then(() => {
            recarregarTreinos();
            patchUi({ modal: null, treinoDetalheId: null });
            showToast('Treino excluído.');
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
            tagTexto: atrasadoX ? (x.atraso || 5) + ' dias' : x.pag === 'cobrado' ? 'cobrado hoje' : 'vence dia ' + diaVencimentoTexto(x),
            botao: x.pag === 'cobrado' ? 'Cobrar de novo' : 'Cobrar',
            cobrar: () =>
              patchUi({
                modal: 'cobranca',
                cobrandoId: x.id,
                msg:
                  'Oi, ' + x.nome.split(' ')[0] + '! Fechei ' + mesAtualNome + ' em ' + brl(c.total) +
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
        if (!abrirWhatsApp(cobrando.fone, S.msg)) {
          showToast('Cadastra o telefone de ' + cobrando.nome.split(' ')[0] + ' pra poder cobrar por WhatsApp.');
          return;
        }
        patchAlunoLocal(id, (x) => ({ ...x, pag: 'cobrado' }));
        db.setAlunoPag(id, 'cobrado').catch(reportError);
        patchUi({ modal: null });
        showToast('WhatsApp aberto pra ' + cobrando.nome.split(' ')[0] + '.');
      },
      toast: S.toast,
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
  }, [domainRaw, ui, atual, patchUi, patchAlunoLocal, showToast, reportError, loading, userId, isAdmin, donoPorAluno, donoPorDespesa, donoPorAcademia, donoPorExercicio, ajustesPorUser, profiles, avaliacoes, treinosDoAluno, recarregarTreinos]);

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
