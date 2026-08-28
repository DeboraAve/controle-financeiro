import type { Academia, Aluno, Despesa, Sessao } from './model';

function dia2(n: number): string {
  return String(n).padStart(2, '0') + '/09';
}

function mkSes(n: number, start: number, step: number, canceladas: number[] = []): Sessao[] {
  const out: Sessao[] = [];
  let d = start;
  for (let i = 0; i < n; i++) {
    out.push({ id: i, dia: dia2(Math.min(d, 30)), s: canceladas.includes(i) ? 'cancelada' : 'feita' });
    d += step;
  }
  return out;
}

function criarSessoesPadrao(previstas: number): Sessao[] {
  const n = Math.max(1, previstas);
  const step = Math.max(1, Math.floor(27 / n));
  return mkSes(n, 2, step, []);
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const letras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return (letras.join('') || '??').slice(0, 2);
}

export const CATS = ['Aluguel de sala', 'Equipamento', 'Transporte', 'Marketing', 'Cursos'];

export const ACADEMIA_MODELOS: { value: Academia['modelo']; label: string }[] = [
  { value: 'mensal_fixo', label: 'Mensal fixo' },
  { value: 'por_aluno', label: 'Por aluno' },
];

export const ACADEMIAS_SEED: Academia[] = [
  { id: 1, nome: 'Vigor', modelo: 'mensal_fixo', valorCobrado: 120, custoPorTrecho: 0, viagensPorSemana: 0 },
  { id: 2, nome: 'LS', modelo: 'mensal_fixo', valorCobrado: 110, custoPorTrecho: 0, viagensPorSemana: 0 },
  { id: 3, nome: 'Top Fitness', modelo: 'mensal_fixo', valorCobrado: 110, custoPorTrecho: 11, viagensPorSemana: 3 },
  { id: 4, nome: 'Estúdio', modelo: 'mensal_fixo', valorCobrado: 0, custoPorTrecho: 0, viagensPorSemana: 0 },
];

export const ALUNOS_SEED: Aluno[] = [
  { id: 1, nome: 'Marina Duarte', inicial: 'MD', plano: 'Pacote 12 aulas', base: 1080, previstas: 12, status: 'ativo', pag: 'pago', horario: 'Ter · Qui 07h', desde: 'mar/24', fone: '(11) 9 8123-4455', ferias: 0, sessoes: mkSes(12, 1, 2, []), academiaId: 1 },
  { id: 2, nome: 'Rafael Lima', inicial: 'RL', plano: 'Pacote 8 aulas', base: 760, previstas: 8, status: 'ativo', pag: 'aberto', horario: 'Seg · Sex 18h', desde: 'jan/25', fone: '(11) 9 8330-1201', ferias: 0, sessoes: mkSes(8, 2, 3, [4]), academiaId: 2 },
  { id: 3, nome: 'Camila Reis', inicial: 'CR', plano: 'Mensalidade fixa', base: 640, previstas: 8, status: 'ativo', pag: 'atrasado', atraso: 12, horario: 'Qua · Sáb 09h', desde: 'ago/23', fone: '(11) 9 9002-7788', ferias: 0, sessoes: mkSes(8, 2, 3, [1, 5]), academiaId: 4 },
  { id: 4, nome: 'Bruno Sato', inicial: 'BS', plano: 'Pacote 8 aulas', base: 760, previstas: 8, status: 'ferias', pag: 'aberto', horario: 'Ter · Qui 19h', desde: 'set/25', fone: '(11) 9 8712-0044', ferias: 380, sessoes: mkSes(8, 3, 3, [2, 3, 6]), academiaId: 3 },
  { id: 5, nome: 'Letícia Nunes', inicial: 'LN', plano: 'Pacote 16 aulas', base: 1360, previstas: 16, status: 'ativo', pag: 'pago', horario: 'Seg a Qui 06h', desde: 'fev/24', fone: '(11) 9 9411-6600', ferias: 0, sessoes: mkSes(16, 1, 2, []), academiaId: 1 },
  { id: 6, nome: 'Thiago Moraes', inicial: 'TM', plano: 'Pacote 12 aulas', base: 1020, previstas: 12, status: 'ativo', pag: 'atrasado', atraso: 5, horario: 'Ter · Qui · Sáb 20h', desde: 'mai/25', fone: '(11) 9 8555-3121', ferias: 0, sessoes: mkSes(12, 2, 2, [7]), academiaId: 2 },
  { id: 7, nome: 'Diego Alves', inicial: 'DA', plano: 'Pacote 8 aulas', base: 720, previstas: 8, status: 'ativo', pag: 'pago', horario: 'Qua · Sex 12h', desde: 'jun/26', fone: '(11) 9 8100-9922', ferias: 0, sessoes: mkSes(8, 2, 3, []), academiaId: 3 },
  { id: 8, nome: 'Sofia Braga', inicial: 'SB', plano: 'Pacote 8 aulas', base: 700, previstas: 8, status: 'inativo', pag: 'pago', horario: 'parou em jun/26', desde: 'nov/24', fone: '(11) 9 8244-3010', ferias: 0, sessoes: mkSes(8, 2, 3, []), academiaId: 2 },
];

export const DESPESAS_SEED: Despesa[] = [
  { id: 1, dia: '02/09', cat: 'Aluguel de sala', desc: 'Sala Vila Mariana', valor: 900 },
  { id: 2, dia: '06/09', cat: 'Transporte', desc: 'Combustível da semana', valor: 210 },
  { id: 3, dia: '11/09', cat: 'Equipamento', desc: 'Elásticos e mini bands', valor: 165 },
  { id: 4, dia: '15/09', cat: 'Marketing', desc: 'Impulsionamento Instagram', valor: 120 },
];

export { criarSessoesPadrao, dia2, iniciais };
