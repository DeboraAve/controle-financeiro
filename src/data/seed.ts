import type { Academia } from './model';

// "DD/MM" do dia n dentro do mês corrente de verdade — antes de existir data
// real no app isso vinha fixo em "/09"; deixado assim teria virado errado
// assim que o mês rolasse.
function dia2(n: number): string {
  const hoje = new Date();
  return String(n).padStart(2, '0') + '/' + String(hoje.getMonth() + 1).padStart(2, '0');
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
