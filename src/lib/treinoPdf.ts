import { jsPDF } from 'jspdf';

export interface TreinoPdfItem {
  exercicioNome: string;
  resumo: string;
  observacoes: string;
}

export interface TreinoPdfDia {
  nome: string;
  itens: TreinoPdfItem[];
}

export interface TreinoPdfDados {
  alunoNome: string;
  nome: string;
  data: string;
  dias: TreinoPdfDia[];
}

// Paleta da marca Impulsa — mesmas cores de tokens.css (--color-pink-solido,
// --color-ink, --color-off-white), só que em RGB porque jsPDF não lê CSS.
const PINK = [209, 50, 104] as const;
const CREME = [255, 247, 243] as const;
const TEXTO = [27, 19, 48] as const;
const CINZA = [118, 110, 126] as const;

export function gerarPdfTreino(d: TreinoPdfDados): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = 0;

  doc.setFillColor(...PINK);
  doc.rect(0, 0, pageW, 110, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TREINO', margin, 38);
  doc.setFontSize(22);
  doc.text(d.alunoNome, margin, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text((d.nome || 'Treino') + ' · montado em ' + d.data, margin, 88);
  y = 140;

  const quebraSeNecessario = (altura: number) => {
    if (y + altura > pageH - 40) {
      doc.addPage();
      y = 48;
    }
  };

  for (const dia of d.dias) {
    quebraSeNecessario(40);
    doc.setTextColor(...PINK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text((dia.nome || 'Treino').toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(...PINK);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 20;

    for (const item of dia.itens) {
      quebraSeNecessario(item.observacoes ? 44 : 32);
      doc.setTextColor(...TEXTO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(item.exercicioNome, margin, y);
      if (item.resumo) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...CINZA);
        doc.text(item.resumo, pageW - margin, y, { align: 'right' });
      }
      y += 16;
      if (item.observacoes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...CINZA);
        const linhas = doc.splitTextToSize(item.observacoes, pageW - margin * 2);
        doc.text(linhas, margin, y);
        y += linhas.length * 12;
      }
      doc.setDrawColor(...CREME);
      doc.setLineWidth(1);
      doc.line(margin, y + 4, pageW - margin, y + 4);
      y += 18;
    }
    y += 12;
  }

  doc.setTextColor(...CINZA);
  doc.setFontSize(8);
  doc.text('Gerado via Impulsa em ' + new Date().toLocaleDateString('pt-BR'), margin, pageH - 30);

  return doc.output('blob');
}
