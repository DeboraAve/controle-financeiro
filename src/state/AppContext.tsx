import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Aluno, Despesa } from '../data/model';
import { ALUNOS_SEED, CATS, DESPESAS_SEED, dia2 } from '../data/seed';
import { brl, calc } from '../lib/calc';
import { useLocalStorageState } from './useLocalStorageState';
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
};

export interface AlunoListItem {
  id: number;
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
  id: number;
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
    id: number;
    dia: string;
    rotulo: string;
    borda: string;
    fundo: string;
    cor: string;
    toggle: () => void;
  }[];
}

function useAppStateInternal() {
  const [domain, setDomain] = useLocalStorageState<DomainState>('controle-financeiro:v1', {
    alunos: ALUNOS_SEED,
    despesas: DESPESAS_SEED,
    grafico: 'Barras mensais',
    metaMensal: 7500,
    diasParaAtraso: 5,
  });
  const [ui, setUi] = useState<UiState>(initialUi);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const patchUi = useCallback((p: Partial<UiState>) => setUi((s) => ({ ...s, ...p })), []);

  const showToast = useCallback((t: string) => {
    clearTimeout(toastTimer.current);
    patchUi({ toast: t });
    toastTimer.current = setTimeout(() => patchUi({ toast: null }), 2600);
  }, [patchUi]);

  const patchAluno = useCallback((id: number, fn: (a: Aluno) => Aluno) => {
    setDomain((s) => ({
      ...s,
      alunos: s.alunos.map((a) => (a.id === id ? fn({ ...a, sessoes: a.sessoes.map((x) => ({ ...x })) }) : a)),
    }));
  }, [setDomain]);

  const atual = domain.alunos.find((a) => a.id === ui.alunoId);

  const vm = useMemo(() => {
    const S = ui;
    const meta = domain.metaMensal;
    const prazo = domain.diasParaAtraso;
    const vizNome = domain.grafico;
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
    const despTotal = domain.despesas.reduce((t, d) => t + d.valor, 0);
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
      return {
        id: a.id,
        nome: a.nome,
        inicial: a.inicial,
        inicialCor: a.status === 'inativo' ? 'var(--color-neutral-500)' : 'var(--color-accent-700)',
        sub: a.plano + ' · ' + a.horario,
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
        sub: a.plano + ' · ' + a.horario,
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
          patchAluno(a.id, (x) => ({ ...x, pag: 'pago' }));
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
          toggle: () =>
            patchAluno(a.id, (x) => ({
              ...x,
              sessoes: x.sessoes.map((y) => (y.id === s.id ? { ...y, s: y.s === 'feita' ? 'cancelada' : 'feita' } : y)),
            })),
        })),
      };
    }

    const cobraveis = domain.alunos.filter((x) => x.status !== 'inativo' && x.pag !== 'pago');
    const cobrando = domain.alunos.find((x) => x.id === S.cobrandoId) || { nome: '', fone: '' };

    const diasComAula: Record<number, number> = {};
    ativos.forEach((x) =>
      x.sessoes.forEach((s) => {
        if (s.s === 'cancelada') return;
        const n = parseInt(s.dia, 10);
        diasComAula[n] = (diasComAula[n] || 0) + calcs.get(x.id)!.valorAula;
      }),
    );
    const selecionado = S.diaSel || 15;
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
    const aulasDoDia: { hora: string; nome: string; nota: string; valor: string; key: string }[] = [];
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
        });
      }),
    );
    const totalDia = aulasDoDia.reduce((t, s) => t + (s.valor.startsWith('−') ? 0 : parseFloat(s.valor.replace(/[^\d]/g, ''))), 0);

    return {
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
        qtdDespesas: domain.despesas.length,
        lucro: brl(lucro),
        margem: Math.round((lucro / (previsto || 1)) * 100),
        saldo: brl(recebido - despTotal),
        meta: brl(meta),
        metaPct,
        metaFrase: faltam > 0 ? 'Faltam ' + brl(faltam) + ' pra bater a meta' : 'Meta batida — ' + brl(-faltam) + ' acima',
        recebidoPct: recPct,
        concentracao: 'Os 3 primeiros são ' + Math.round((top3 / (previsto || 1)) * 100) + '% do seu mês.',
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
          marca: on ? 'currentColor' : 'transparent',
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
      addExtra: () => a && patchAluno(a.id, (x) => ({ ...x, sessoes: [...x.sessoes, { id: Date.now(), dia: dia2(28), s: 'extra' }] })),
      limparAjustes: () =>
        a &&
        patchAluno(a.id, (x) => ({
          ...x,
          ferias: 0,
          sessoes: x.sessoes.filter((s) => s.s !== 'extra').map((s) => ({ ...s, s: 'feita' })),
        })),
      abrirFerias: () => {
        if (!a) return;
        if (a.status === 'ferias') {
          patchAluno(a.id, (x) => ({ ...x, status: 'ativo', ferias: 0 }));
          showToast(a.nome + ' voltou das férias.');
        } else {
          patchUi({ modal: 'ferias', feriasValor: String(Math.round(a.base / 2)) });
        }
      },
      abrirInativar: () => {
        if (!a) return;
        if (a.status === 'inativo') {
          patchAluno(a.id, (x) => ({ ...x, status: 'ativo' }));
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
      fecharModal: () => patchUi({ modal: null }),
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
        patchAluno(a.id, (x) => ({ ...x, status: 'ferias', ferias: v }));
        patchUi({ modal: null });
        showToast('Férias marcadas — ' + brl(v) + ' descontados de setembro.');
      },
      confirmarInativar: () => {
        if (!a) return;
        patchAluno(a.id, (x) => ({ ...x, status: 'inativo' }));
        patchUi({ modal: null });
        showToast(a.nome + ' inativado. Histórico preservado.');
      },
      semana: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
      diasMes,
      dia: {
        titulo: String(selecionado).padStart(2, '0') + ' de setembro',
        total: brl(totalDia),
        aulas: aulasDoDia,
        rodape: aulasDoDia.length ? aulasDoDia.length + ' aula(s) neste dia' : 'Dia livre — nada lançado.',
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
        setDomain((s) => ({
          ...s,
          despesas: [{ id: Date.now(), dia: '28/09', cat: S.despCat, desc: S.despDesc || S.despCat, valor: v }, ...s.despesas],
        }));
        patchUi({ despValor: '', despDesc: '' });
        showToast('Despesa de ' + brl(v) + ' lançada.');
      },
      despesas: domain.despesas.map((d) => ({ id: d.id, dia: d.dia, cat: d.cat, desc: d.desc, valor: brl(d.valor) })),
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
              patchAluno(x.id, (y) => ({ ...y, pag: 'pago' }));
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
        patchAluno(S.cobrandoId, (x) => ({ ...x, pag: 'cobrado' }));
        patchUi({ modal: null });
        showToast('Mensagem enviada para ' + cobrando.nome.split(' ')[0] + '.');
      },
      toast: S.toast,
      temToast: !!S.toast,
      // settings (Ajustes)
      grafico: domain.grafico,
      setGrafico: (v: DomainState['grafico']) => setDomain((s) => ({ ...s, grafico: v })),
      metaMensal: domain.metaMensal,
      setMetaMensal: (v: number) => setDomain((s) => ({ ...s, metaMensal: v })),
      diasParaAtraso: domain.diasParaAtraso,
      setDiasParaAtraso: (v: number) => setDomain((s) => ({ ...s, diasParaAtraso: v })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, ui, atual, patchUi, patchAluno, showToast, setDomain]);

  return vm;
}

type AppVm = ReturnType<typeof useAppStateInternal>;

const AppContext = createContext<AppVm | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const vm = useAppStateInternal();
  return <AppContext.Provider value={vm}>{children}</AppContext.Provider>;
}

export function useApp(): AppVm {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export type { Despesa };
