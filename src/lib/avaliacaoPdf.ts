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
  doc.setFontSize(9);
  // Espaça as letras à mão (jsPDF não tem letter-spacing) pra imitar o
  // tom "wordmark" do app no canto do cabeçalho.
  doc.text('I M P U L S A', pageW - margin, 30, { align: 'right' });
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

  // Título curto (traço de destaque de 30pt, não a largura da página
  // inteira) em vez de uma linha horizontal cheia repetida 5-6 vezes por
  // página — era isso que dava a cara de planilha exportada.
  const secao = (titulo: string) => {
    doc.setTextColor(...PINK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(titulo.toUpperCase(), margin, y);
    y += 8;
    doc.setDrawColor(...PINK);
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + 30, y);
    y += 20;
  };

  // Cada campo vira um cartãozinho (fundo creme, cantos arredondados) em
  // vez de texto solto — era o que fazia a página parecer crua/rascunho.
  // Título e cartões quebram de página juntos como um bloco só — antes o
  // título calculava sua própria quebra sem saber do bloco de cartões
  // logo depois, então às vezes ele ficava sozinho no rodapé de uma
  // página enquanto os cartões pulavam pra próxima, sobrando um vão em
  // branco embaixo do título (achado com um PDF de verdade, não só lendo
  // o código).
  const secaoComCampos = (titulo: string, campos: AvaliacaoPdfCampo[], porLinha = 3) => {
    const gap = 8;
    const colW = (pageW - margin * 2 - gap * (porLinha - 1)) / porLinha;
    const linhas = Math.ceil(campos.length / porLinha);
    // Cartão cresce um pouco quando existe delta pra caber a linha extra,
    // pequena e em rosa, sem espremer no mesmo renglão do valor — em
    // colunas estreitas (dobras/perimetria, 4 por linha) um valor tipo
    // "60 cm (-31.0)" não cabe junto sem risco de cortar.
    const cardH = deltaPorLabel.size ? 56 : 46;
    const alturaTitulo = 28;
    const alturaCartoes = linhas * (cardH + gap);
    quebraSeNecessario(alturaTitulo + alturaCartoes);

    secao(titulo);
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
    y += alturaCartoes + 10;
  };

  if (secoes.gerais) {
    secaoComCampos('Dados gerais', d.gerais);
  }

  if (secoes.composicao) {
    const composicao: AvaliacaoPdfCampo[] = [
      { label: 'IMC', valor: d.imcFmt + ' · ' + d.imcClasse },
      { label: 'Risco à saúde', valor: d.risco },
      { label: '% de gordura', valor: d.percentualGorduraFmt },
      { label: 'Peso gordo', valor: d.pesoGordoFmt },
      { label: 'Massa magra', valor: d.massaMagraFmt },
    ];
    if (d.rcqFmt) composicao.push({ label: 'Relação cintura-quadril', valor: d.rcqFmt });
    secaoComCampos('Composição corporal', composicao);
  }

  if (secoes.dobras && d.dobras.length) {
    secaoComCampos('Dobras cutâneas (mm)', d.dobras, 4);
  }

  if (secoes.perimetria && d.perimetria.length) {
    secaoComCampos('Perimetria (cm)', d.perimetria, 4);
  }

  if (secoes.observacoes && d.observacoes.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const linhasObs = doc.splitTextToSize(d.observacoes, pageW - margin * 2);
    quebraSeNecessario(28 + linhasObs.length * 14 + 10);
    secao('Observações');
    doc.setTextColor(...TEXTO);
    doc.text(linhasObs, margin, y);
    y += linhasObs.length * 14 + 10;
  }

  // Carimba rodapé + numeração em toda página — antes só a última página
  // (a que `y` calhava de estar quando o doc terminava) ganhava rodapé;
  // com a avaliação agora normalmente virando 2+ páginas, as anteriores
  // ficavam sem nada embaixo.
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
