import { jsPDF } from 'jspdf';
import type { DeltaCampo } from './avaliacaoCalc';

export interface AvaliacaoPdfCampo {
  label: string;
  valor: string;
}

export interface AvaliacaoPdfDados {
  alunoNome: string;
  data: string;
  resumoLinha: string; // "32 anos · F · desde 07/23"
  imcFmt: string;
  imcClasse: string;
  risco: string;
  percentualGorduraFmt: string;
  pesoGordoFmt: string;
  massaMagraFmt: string;
  rcqFmt: string | null;
  gerais: AvaliacaoPdfCampo[];
  dobras: AvaliacaoPdfCampo[];
  perimetria: AvaliacaoPdfCampo[];
  observacoes: string;
}

export interface AvaliacaoPdfSecoes {
  gerais: boolean;
  composicao: boolean;
  dobras: boolean;
  perimetria: boolean;
  comparacao: boolean;
  observacoes: boolean;
}

export const AVALIACAO_PDF_SECOES_PADRAO: AvaliacaoPdfSecoes = {
  gerais: true,
  composicao: true,
  dobras: true,
  perimetria: true,
  comparacao: true,
  observacoes: true,
};

export interface AvaliacaoPdfComparacao {
  data: string;
  itens: DeltaCampo[];
}

// Paleta da marca Impulsa — mesmas cores de tokens.css (--color-pink-solido,
// --color-ink, --color-off-white), só que em RGB porque jsPDF não lê CSS.
const PINK = [209, 50, 104] as const;
const CREME = [255, 247, 243] as const;
const TEXTO = [27, 19, 48] as const;
const CINZA = [118, 110, 126] as const;

export function gerarPdfAvaliacao(d: AvaliacaoPdfDados, secoes: AvaliacaoPdfSecoes = AVALIACAO_PDF_SECOES_PADRAO, comparacao: AvaliacaoPdfComparacao | null = null): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = 0;

  // Sem isso um aluno com as 7 dobras + perimetria + comparação +
  // observações longas simplesmente escrevia por baixo do rodapé da
  // página — nada quebrava pra uma segunda página (só o treino tinha
  // esse cuidado, a avaliação nunca teve).
  const quebraSeNecessario = (altura: number) => {
    if (y + altura > pageH - 40) {
      doc.addPage();
      y = 48;
    }
  };

  // header
  doc.setFillColor(...PINK);
  doc.rect(0, 0, pageW, 110, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AVALIAÇÃO FÍSICA', margin, 38);
  doc.setFontSize(22);
  doc.text(d.alunoNome, margin, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(d.resumoLinha + ' · avaliação de ' + d.data, margin, 88);
  y = 140;

  // A diferença de cada campo entra junto do próprio valor (ver
  // `linhaCampos`), igual a tela — em vez de uma seção "Comparado com"
  // à parte repetindo os mesmos campos lá embaixo.
  const deltaPorLabel = new Map<string, DeltaCampo>();
  if (secoes.comparacao && comparacao) {
    for (const it of comparacao.itens) deltaPorLabel.set(it.label, it);
    doc.setTextColor(...PINK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Comparado com a avaliação de ' + comparacao.data, margin, y);
    y += 20;
  }

  const secao = (titulo: string) => {
    quebraSeNecessario(30);
    doc.setTextColor(...PINK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(titulo.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(...PINK);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 22;
  };

  // Cada campo vira um cartãozinho (fundo creme, cantos arredondados) em
  // vez de texto solto — era o que fazia a página parecer crua/rascunho.
  const linhaCampos = (campos: AvaliacaoPdfCampo[], porLinha = 3) => {
    const gap = 8;
    const colW = (pageW - margin * 2 - gap * (porLinha - 1)) / porLinha;
    const linhas = Math.ceil(campos.length / porLinha);
    // Cartão cresce um pouco quando existe delta pra caber a linha extra,
    // pequena e em rosa, sem espremer no mesmo renglão do valor — em
    // colunas estreitas (dobras/perimetria, 4 por linha) um valor tipo
    // "60 cm (-31.0)" não cabe junto sem risco de cortar.
    const cardH = deltaPorLabel.size ? 56 : 46;
    quebraSeNecessario(linhas * (cardH + gap));
    doc.setFontSize(9);
    campos.forEach((c, i) => {
      const col = i % porLinha;
      const linha = Math.floor(i / porLinha);
      const x = margin + col * (colW + gap);
      const cy = y + linha * (cardH + gap);
      doc.setFillColor(...CREME);
      doc.roundedRect(x, cy, colW, cardH, 6, 6, 'F');
      doc.setTextColor(...CINZA);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(c.label.toUpperCase(), x + 10, cy + 17);
      doc.setTextColor(...TEXTO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(c.valor, x + 10, cy + 35);
      const dt = deltaPorLabel.get(c.label);
      if (dt) {
        doc.setTextColor(...PINK);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text((dt.delta >= 0 ? '+' : '') + dt.delta.toFixed(1) + (dt.unidade ? ' ' + dt.unidade : ''), x + 10, cy + 48);
      }
      doc.setFontSize(9);
    });
    y += linhas * (cardH + gap) + 10;
  };

  if (secoes.gerais) {
    secao('Dados gerais');
    linhaCampos(d.gerais);
  }

  if (secoes.composicao) {
    secao('Composição corporal');
    const composicao: AvaliacaoPdfCampo[] = [
      { label: 'IMC', valor: d.imcFmt + ' · ' + d.imcClasse },
      { label: 'Risco à saúde', valor: d.risco },
      { label: '% de gordura', valor: d.percentualGorduraFmt },
      { label: 'Peso gordo', valor: d.pesoGordoFmt },
      { label: 'Massa magra', valor: d.massaMagraFmt },
    ];
    if (d.rcqFmt) composicao.push({ label: 'Relação cintura-quadril', valor: d.rcqFmt });
    linhaCampos(composicao);
  }

  if (secoes.dobras && d.dobras.length) {
    secao('Dobras cutâneas (mm)');
    linhaCampos(d.dobras, 4);
  }

  if (secoes.perimetria && d.perimetria.length) {
    secao('Perimetria (cm)');
    linhaCampos(d.perimetria, 4);
  }

  if (secoes.observacoes && d.observacoes.trim()) {
    secao('Observações');
    doc.setTextColor(...TEXTO);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const linhas = doc.splitTextToSize(d.observacoes, pageW - margin * 2);
    quebraSeNecessario(linhas.length * 14 + 10);
    doc.text(linhas, margin, y);
    y += linhas.length * 14 + 10;
  }

  doc.setFillColor(...CREME);
  doc.setDrawColor(...CREME);
  doc.setTextColor(...CINZA);
  doc.setFontSize(8);
  doc.text('Gerado via Impulsa em ' + new Date().toLocaleDateString('pt-BR'), margin, doc.internal.pageSize.getHeight() - 30);

  return doc.output('blob');
}
