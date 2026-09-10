export interface AvaliacaoInput {
  peso: number; // kg
  estatura: number; // m
  idade: number;
  sexo: 'M' | 'F';
  dobraPeitoral: number | null;
  dobraAxilar: number | null;
  dobraTriceps: number | null;
  dobraSubescapular: number | null;
  dobraAbdominal: number | null;
  dobraSuprailiaca: number | null;
  dobraCoxa: number | null;
}

export interface AvaliacaoResultado {
  imc: number;
  imcClasse: string;
  risco: string;
  temDobras: boolean;
  somaDobras: number | null;
  percentualGordura: number | null;
  pesoGordo: number | null;
  massaMagra: number | null;
}

function classificarImc(imc: number): { classe: string; risco: string } {
  if (imc < 18.5) return { classe: 'Abaixo do peso', risco: 'Risco aumentado' };
  if (imc < 25) return { classe: 'Peso normal', risco: 'Risco baixo' };
  if (imc < 30) return { classe: 'Sobrepeso', risco: 'Risco moderado' };
  if (imc < 35) return { classe: 'Obesidade grau I', risco: 'Risco alto' };
  if (imc < 40) return { classe: 'Obesidade grau II', risco: 'Risco muito alto' };
  return { classe: 'Obesidade grau III', risco: 'Risco extremamente alto' };
}

export interface RcqResultado {
  valor: number;
  classe: string;
}

// Relação cintura-quadril — faixas de risco à saúde da OMS.
export function calcularRcq(sexo: 'M' | 'F', cintura: number | null, quadril: number | null): RcqResultado | null {
  if (!cintura || !quadril) return null;
  const valor = cintura / quadril;
  const cortes = sexo === 'M' ? [0.9, 0.99] : [0.8, 0.85];
  const classe = valor < cortes[0] ? 'Risco baixo' : valor <= cortes[1] ? 'Risco moderado' : 'Risco alto';
  return { valor, classe };
}

// Protocolo de 7 dobras cutâneas (Jackson & Pollock, 1978/1980) + equação de Siri.
// Referência padrão usada na maioria dos softwares de avaliação física no Brasil.
export function calcularAvaliacao(input: AvaliacaoInput): AvaliacaoResultado {
  const imc = input.peso / (input.estatura * input.estatura);
  const { classe, risco } = classificarImc(imc);

  const dobras = [
    input.dobraPeitoral,
    input.dobraAxilar,
    input.dobraTriceps,
    input.dobraSubescapular,
    input.dobraAbdominal,
    input.dobraSuprailiaca,
    input.dobraCoxa,
  ];
  const dobrasPreenchidas = dobras.filter((d): d is number => d != null && d > 0);
  const temDobras = dobrasPreenchidas.length === 7;

  if (!temDobras) {
    return { imc, imcClasse: classe, risco, temDobras: false, somaDobras: null, percentualGordura: null, pesoGordo: null, massaMagra: null };
  }

  const soma = dobrasPreenchidas.reduce((t, d) => t + d, 0);
  const densidade =
    input.sexo === 'M'
      ? 1.112 - 0.00043499 * soma + 0.00000055 * soma * soma - 0.00028826 * input.idade
      : 1.097 - 0.00046971 * soma + 0.00000056 * soma * soma - 0.00012828 * input.idade;

  const percentualGordura = 495 / densidade - 450;
  const pesoGordo = (percentualGordura / 100) * input.peso;
  const massaMagra = input.peso - pesoGordo;

  return { imc, imcClasse: classe, risco, temDobras: true, somaDobras: soma, percentualGordura, pesoGordo, massaMagra };
}

// Valores numéricos "crus" de uma avaliação — usados só pra comparar duas
// avaliações entre si (tela e PDF), separado dos campos já formatados como
// texto que o resto do app usa pra exibir.
export interface AvaliacaoBruto {
  peso: number;
  imc: number;
  percentualGordura: number | null;
  massaMagra: number | null;
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
}

export interface DeltaCampo {
  label: string;
  unidade: string;
  atual: number;
  anterior: number;
  delta: number;
}

export interface CampoAvaliacao {
  key: keyof AvaliacaoBruto;
  label: string;
  unidade: string;
}

// Catálogo único dos campos que dá pra comparar/plotar — usado tanto pela
// comparação entre avaliações quanto pelos gráficos de evolução, pra não
// duplicar a lista de labels em dois lugares.
export const CAMPOS_COMPARAVEIS: CampoAvaliacao[] = [
  { key: 'peso', label: 'Peso', unidade: 'kg' },
  { key: 'imc', label: 'IMC', unidade: '' },
  { key: 'percentualGordura', label: '% de gordura', unidade: '%' },
  { key: 'massaMagra', label: 'Massa magra', unidade: 'kg' },
  { key: 'dobraPeitoral', label: 'Peitoral', unidade: 'mm' },
  { key: 'dobraAxilar', label: 'Axilar média', unidade: 'mm' },
  { key: 'dobraTriceps', label: 'Tríceps', unidade: 'mm' },
  { key: 'dobraSubescapular', label: 'Subescapular', unidade: 'mm' },
  { key: 'dobraAbdominal', label: 'Abdominal', unidade: 'mm' },
  { key: 'dobraSuprailiaca', label: 'Suprailíaca', unidade: 'mm' },
  { key: 'dobraCoxa', label: 'Coxa', unidade: 'mm' },
  { key: 'dobraBiceps', label: 'Bíceps', unidade: 'mm' },
  { key: 'dobraPanturrilha', label: 'Panturrilha', unidade: 'mm' },
  { key: 'perimPescoco', label: 'Pescoço', unidade: 'cm' },
  { key: 'perimTorax', label: 'Tórax', unidade: 'cm' },
  { key: 'perimCintura', label: 'Cintura', unidade: 'cm' },
  { key: 'perimAbdomen', label: 'Abdômen', unidade: 'cm' },
  { key: 'perimQuadril', label: 'Quadril', unidade: 'cm' },
];

// Só compara campo que existe nas duas avaliações — se uma delas não tinha
// perimetria preenchida, por exemplo, esse campo simplesmente não entra.
export function compararAvaliacoes(atual: AvaliacaoBruto, anterior: AvaliacaoBruto): DeltaCampo[] {
  const out: DeltaCampo[] = [];
  for (const c of CAMPOS_COMPARAVEIS) {
    const va = atual[c.key];
    const vb = anterior[c.key];
    if (va == null || vb == null) continue;
    out.push({ label: c.label, unidade: c.unidade, atual: va, anterior: vb, delta: va - vb });
  }
  return out;
}
