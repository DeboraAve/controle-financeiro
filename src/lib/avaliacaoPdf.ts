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
  const margin = 48;
  let y = 0;

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

  const secao = (titulo: string) => {
    doc.setTextColor(...PINK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(titulo.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(...PINK);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 18;
  };

  const linhaCampos = (campos: AvaliacaoPdfCampo[], porLinha = 3) => {
    const colW = (pageW - margin * 2) / porLinha;
    doc.setFontSize(9);
    campos.forEach((c, i) => {
      const col = i % porLinha;
      if (col === 0 && i > 0) y += 34;
      const x = margin + col * colW;
      doc.setTextColor(...CINZA);
      doc.setFont('helvetica', 'normal');
      doc.text(c.label.toUpperCase(), x, y);
      doc.setTextColor(...TEXTO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(c.valor, x, y + 17);
      doc.setFontSize(9);
    });
    y += 40;
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

  if (secoes.comparacao && comparacao && comparacao.itens.length) {
    secao('Comparado com ' + comparacao.data);
    const campos: AvaliacaoPdfCampo[] = comparacao.itens.map((it) => ({
      label: it.label,
      valor: (it.delta >= 0 ? '+' : '') + it.delta.toFixed(1) + (it.unidade ? ' ' + it.unidade : ''),
    }));
    linhaCampos(campos, 4);
  }

  if (secoes.observacoes && d.observacoes.trim()) {
    secao('Observações');
    doc.setTextColor(...TEXTO);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const linhas = doc.splitTextToSize(d.observacoes, pageW - margin * 2);
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
