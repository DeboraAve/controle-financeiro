import type { Academia, Sessao } from './model';

function dia2(n: number): string {
  return String(n).padStart(2, '0') + '/09';
}

function mkSes(n: number, start: number, step: number): { dia: string; status: Sessao['s'] }[] {
  const out: { dia: string; status: Sessao['s'] }[] = [];
  let d = start;
  for (let i = 0; i < n; i++) {
    out.push({ dia: dia2(Math.min(d, 30)), status: 'feita' });
    d += step;
  }
  return out;
}

function criarSessoesPadrao(previstas: number): { dia: string; status: Sessao['s'] }[] {
  const n = Math.max(1, previstas);
  const step = Math.max(1, Math.floor(27 / n));
  return mkSes(n, 2, step);
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

export { criarSessoesPadrao, dia2, iniciais };
