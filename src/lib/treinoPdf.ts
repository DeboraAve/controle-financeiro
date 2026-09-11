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
  doc.setFontSize(9);
  doc.text('I M P U L S A', pageW - margin, 30, { align: 'right' });
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
    // Calcula a altura do primeiro exercício pra quebrar junto com o
    // título do dia — senão o título fica sozinho no rodapé de uma
    // página enquanto o primeiro exercício pula pra próxima (mesmo bug
    // achado e corrigido no PDF de avaliação).
    doc.setFontSize(9);
    const primeiro = dia.itens[0];
    const alturaPrimeiroItem = primeiro
      ? 34 + (primeiro.observacoes ? doc.splitTextToSize(primeiro.observacoes, pageW - margin * 2 - 24).length * 12 + 6 : 0) + 8
      : 0;
    quebraSeNecessario(34 + alturaPrimeiroItem);

    doc.setTextColor(...PINK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text((dia.nome || 'Treino').toUpperCase(), margin, y);
    y += 8;
    doc.setDrawColor(...PINK);
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + 30, y);
    y += 18;

    // Cada exercício vira um cartãozinho (fundo creme) em vez de nome +
    // linha divisória — mesma linguagem visual do PDF de avaliação, em
    // vez de uma parede de linhas horizontais repetidas por exercício.
    for (const item of dia.itens) {
      doc.setFontSize(9);
      const linhasObs = item.observacoes ? doc.splitTextToSize(item.observacoes, pageW - margin * 2 - 24) : [];
      const cardH = 34 + (linhasObs.length ? linhasObs.length * 12 + 6 : 0);
      quebraSeNecessario(cardH + 8);

      doc.setFillColor(...CREME);
      doc.roundedRect(margin, y, pageW - margin * 2, cardH, 6, 6, 'F');
      doc.setTextColor(...TEXTO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(item.exercicioNome, margin + 12, y + 21);
      if (item.resumo) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...CINZA);
        doc.text(item.resumo, pageW - margin - 12, y + 21, { align: 'right' });
      }
      if (linhasObs.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...CINZA);
        doc.text(linhasObs, margin + 12, y + 37);
      }
      y += cardH + 8;
    }
    y += 12;
  }

  // Carimba rodapé + numeração em toda página, não só a última — um
  // treino com vários dias pode virar 2+ páginas.
  const totalPaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setTextColor(...CINZA);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Gerado via Impulsa em ' + new Date().toLocaleDateString('pt-BR'), margin, pageH - 30);
    doc.text(`Página ${p}/${totalPaginas}`, pageW - margin, pageH - 30, { align: 'right' });
  }

  return doc.output('blob');
}
