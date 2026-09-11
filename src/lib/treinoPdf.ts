import { jsPDF } from 'jspdf';
import { logoBase64 } from './pdfLogo';

export interface TreinoPdfItem {
  exercicioNome: string;
  series: number | null;
  repeticoes: string;
  carga: number | null;
  descanso: string;
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
const BORDA_CARTAO = [237, 200, 213] as const;

// Larguras das colunas em fração da área útil — exercício ganha quase
// metade, o resto se divide entre as 4 colunas de prescrição.
const COLUNAS = [
  { titulo: 'Exercício', frac: 0.36, align: 'left' as const },
  { titulo: 'Séries', frac: 0.14, align: 'center' as const },
  { titulo: 'Repetições', frac: 0.18, align: 'center' as const },
  { titulo: 'Carga', frac: 0.16, align: 'center' as const },
  { titulo: 'Descanso', frac: 0.16, align: 'center' as const },
];

export async function gerarPdfTreino(d: TreinoPdfDados): Promise<Blob> {
  const logo = await logoBase64();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const larguraTabela = pageW - margin * 2;
  const colX: number[] = [];
  {
    let x = margin;
    for (const c of COLUNAS) {
      colX.push(x);
      x += c.frac * larguraTabela;
    }
  }
  let y = 0;

  // Faixa de marca fina, repetida em toda página a partir da 2ª — mesma
  // correção do PDF de avaliação, senão só a 1ª página tem qualquer
  // identidade visual e a 2ª começa do nada, sem cor nenhuma.
  const desenharCabecalhoContinuacao = () => {
    doc.setFillColor(...PINK);
    doc.rect(0, 0, pageW, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(d.alunoNome, margin, 22);
    doc.addImage(logo, 'PNG', pageW - margin - 16, 9, 16, 16);
    y = 34 + 26;
  };

  doc.setFillColor(...PINK);
  doc.rect(0, 0, pageW, 110, 'F');
  doc.setFillColor(...CREME);
  doc.rect(0, 110, pageW, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.addImage(logo, 'PNG', pageW - margin - 22, 18, 22, 22);
  doc.setFontSize(11);
  doc.text('TREINO', margin, 38);
  doc.setFontSize(22);
  doc.text(d.alunoNome, margin, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text((d.nome || 'Treino') + ' · montado em ' + d.data, margin, 88);
  y = 142;

  let ultimoDiaEmAndamento: TreinoPdfDia | null = null;

  const quebraSeNecessario = (altura: number) => {
    if (y + altura > pageH - 40) {
      doc.addPage();
      desenharCabecalhoContinuacao();
      // Uma tabela que atravessa a quebra repete o cabeçalho de coluna na
      // página seguinte — sem isso os números soltos numa página nova,
      // sem "Séries/Repetições/Carga/Descanso" em cima, não dizem nada.
      if (ultimoDiaEmAndamento) desenharCabecalhoTabela();
    }
  };

  const desenharCabecalhoTabela = () => {
    doc.setFillColor(...PINK);
    doc.rect(margin, y, larguraTabela, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    COLUNAS.forEach((c, i) => {
      const cx = c.align === 'left' ? colX[i] + 10 : colX[i] + (c.frac * larguraTabela) / 2;
      doc.text(c.titulo.toUpperCase(), cx, y + 15, { align: c.align });
    });
    y += 22;
  };

  for (const dia of d.dias) {
    // Só entra "em andamento" depois que a tabela já foi desenhada uma
    // vez — antes disso uma quebra de página é só o título procurando
    // espaço, não deve repetir cabeçalho de coluna nenhum ainda.
    ultimoDiaEmAndamento = null;
    quebraSeNecessario(30 + 22);

    doc.setTextColor(...PINK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text((dia.nome || 'Treino').toUpperCase(), margin, y);
    y += 10;

    if (dia.itens.length === 0) {
      doc.setTextColor(...CINZA);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Nenhum exercício nesse dia.', margin, y + 12);
      y += 30;
      continue;
    }

    desenharCabecalhoTabela();
    ultimoDiaEmAndamento = dia;

    // Uma linha de tabela por exercício — série/repetição/carga/descanso
    // em colunas alinhadas, em vez de texto solto por cartão. A
    // observação (quando tem) entra como uma nota menor, em itálico, logo
    // abaixo do nome, dentro da própria linha.
    dia.itens.forEach((item, i) => {
      doc.setFontSize(8);
      const linhasObs = item.observacoes ? doc.splitTextToSize(item.observacoes, COLUNAS[0].frac * larguraTabela - 16) : [];
      const rowH = 24 + (linhasObs.length ? linhasObs.length * 10 + 4 : 0);
      quebraSeNecessario(rowH);

      if (i % 2 === 1) {
        doc.setFillColor(...CREME);
        doc.rect(margin, y, larguraTabela, rowH, 'F');
      }
      doc.setDrawColor(...BORDA_CARTAO);
      doc.setLineWidth(0.5);
      doc.line(margin, y + rowH, margin + larguraTabela, y + rowH);

      const valores = [
        item.exercicioNome,
        item.series != null ? String(item.series) : '—',
        item.repeticoes || '—',
        item.carga != null ? item.carga.toLocaleString('pt-BR') + ' kg' : '—',
        item.descanso || '—',
      ];
      doc.setTextColor(...TEXTO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(valores[0], colX[0] + 10, y + 16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CINZA);
      for (let c = 1; c < COLUNAS.length; c++) {
        const cx = colX[c] + (COLUNAS[c].frac * larguraTabela) / 2;
        doc.text(valores[c], cx, y + 16, { align: 'center' });
      }
      if (linhasObs.length) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...CINZA);
        doc.text(linhasObs, colX[0] + 10, y + 29);
      }
      y += rowH;
    });
    y += 20;
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
