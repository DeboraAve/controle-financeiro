import { jsPDF } from 'jspdf';

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

const CORAL = [217, 80, 38] as const;
const CREME = [248, 246, 244] as const;
const TEXTO = [48, 40, 33] as const;
const CINZA = [135, 127, 120] as const;

export function gerarPdfAvaliacao(d: AvaliacaoPdfDados): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 0;

  // header
  doc.setFillColor(...CORAL);
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
    doc.setTextColor(...CORAL);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(titulo.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(...CORAL);
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

  secao('Dados gerais');
  linhaCampos(d.gerais);

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

  if (d.dobras.length) {
    secao('Dobras cutâneas (mm)');
    linhaCampos(d.dobras, 4);
  }

  if (d.perimetria.length) {
    secao('Perimetria (cm)');
    linhaCampos(d.perimetria, 4);
  }

  if (d.observacoes.trim()) {
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
  doc.text('Gerado pelo Controle Financeiro em ' + new Date().toLocaleDateString('pt-BR'), margin, doc.internal.pageSize.getHeight() - 30);

  return doc.output('blob');
}
