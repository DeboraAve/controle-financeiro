import type { Academia } from './model';

function dia2(n: number): string {
  return String(n).padStart(2, '0') + '/09';
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

export { dia2, iniciais };
