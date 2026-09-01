import { useApp } from '../../state/AppContext';
import { BlueprintCard } from '../BlueprintCard';

function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function AvaliacaoDetalheModal() {
  const { modalAvaliacaoDetalhe, avaliacaoDetalheAtual, fecharModal } = useApp();
  if (!modalAvaliacaoDetalhe || !avaliacaoDetalheAtual) return null;
  const av = avaliacaoDetalheAtual;

  const nomeArquivo = 'avaliacao-' + av.pdfDados.alunoNome.replace(/\s+/g, '-').toLowerCase() + '-' + av.data.replace(/\//g, '-') + '.pdf';

  const baixar = async () => {
    const { gerarPdfAvaliacao } = await import('../../lib/avaliacaoPdf');
    baixarBlob(gerarPdfAvaliacao(av.pdfDados), nomeArquivo);
  };

  const compartilhar = async () => {
    const { gerarPdfAvaliacao } = await import('../../lib/avaliacaoPdf');
    const blob = gerarPdfAvaliacao(av.pdfDados);
    const file = new File([blob], nomeArquivo, { type: 'application/pdf' });
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Avaliação física', text: 'Avaliação física de ' + av.pdfDados.alunoNome });
        return;
      } catch {
        // cancelou ou não deu — cai pro download
      }
    }
    baixarBlob(blob, nomeArquivo);
  };

  const linha = (label: string, valor: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid color-mix(in srgb, var(--color-text) 6%, transparent)', paddingBottom: 5 }}>
      <span style={{ color: 'var(--color-neutral-600)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-heading)' }}>{valor}</span>
    </div>
  );

  return (
    <div className="dialog-backdrop" style={{ zIndex: 85 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)', width: 'min(480px, 100%)', maxHeight: '88vh', overflow: 'auto' }}>
        <div className="dialog-title">Avaliação de {av.data}</div>

        <div className="card" style={{ gap: 6 }}>
          <div className="card-kicker">Composição corporal</div>
          {linha('IMC', av.imcFmt + ' · ' + av.imcClasse)}
          {linha('Risco à saúde', av.risco)}
          {linha('% de gordura', av.percentualGorduraFmt)}
          {linha('Massa magra', av.massaMagraFmt)}
          {av.rcqFmt && linha('Relação cintura-quadril', av.rcqFmt)}
        </div>

        {av.pdfDados.dobras.length > 0 && (
          <div className="card" style={{ gap: 6 }}>
            <div className="card-kicker">Dobras cutâneas</div>
            {av.pdfDados.dobras.map((c) => <div key={c.label}>{linha(c.label, c.valor)}</div>)}
          </div>
        )}

        {av.pdfDados.perimetria.length > 0 && (
          <div className="card" style={{ gap: 6 }}>
            <div className="card-kicker">Perimetria</div>
            {av.pdfDados.perimetria.map((c) => <div key={c.label}>{linha(c.label, c.valor)}</div>)}
          </div>
        )}

        {av.observacoes && (
          <div className="card" style={{ gap: 6 }}>
            <div className="card-kicker">Observações</div>
            <div style={{ fontSize: 13 }}>{av.observacoes}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={baixar}>Baixar PDF</button>
          <button className="btn btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={compartilhar}>Enviar por WhatsApp</button>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={fecharModal}>Fechar</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
