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
