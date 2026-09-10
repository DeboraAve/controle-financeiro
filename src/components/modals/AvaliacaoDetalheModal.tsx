import { useEffect, useState } from 'react';
import { useApp } from '../../state/AppContext';
import { compararAvaliacoes, type DeltaCampo } from '../../lib/avaliacaoCalc';
import type { AvaliacaoPdfSecoes } from '../../lib/avaliacaoPdf';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

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

const SECOES_LABELS: { key: keyof AvaliacaoPdfSecoes; label: string }[] = [
  { key: 'gerais', label: 'Dados gerais' },
  { key: 'composicao', label: 'Composição corporal' },
  { key: 'dobras', label: 'Dobras cutâneas' },
  { key: 'perimetria', label: 'Perimetria' },
  { key: 'comparacao', label: 'Comparação' },
  { key: 'observacoes', label: 'Observações' },
];

export function AvaliacaoDetalheModal() {
  const { modalAvaliacaoDetalhe, avaliacaoDetalheAtual, avaliacoes, fecharModal } = useApp();
  const av = avaliacaoDetalheAtual;

  const [compararComId, setCompararComId] = useState<string>('');
  const [secoes, setSecoes] = useState<AvaliacaoPdfSecoes>({ gerais: true, composicao: true, dobras: true, perimetria: true, comparacao: true, observacoes: true });

  useEffect(() => {
    if (!av) return;
    const idx = avaliacoes.findIndex((x) => x.id === av.id);
    const anterior = idx >= 0 ? avaliacoes[idx + 1] : undefined;
    setCompararComId(anterior?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [av?.id]);

  const comparada = compararComId ? avaliacoes.find((x) => x.id === compararComId) : undefined;
  const deltas: DeltaCampo[] = av && comparada ? compararAvaliacoes(av.bruto, comparada.bruto) : [];
  const outrasAvaliacoes = av ? avaliacoes.filter((x) => x.id !== av.id) : [];

  const toggleSecao = (key: keyof AvaliacaoPdfSecoes) => setSecoes((s) => ({ ...s, [key]: !s[key] }));

  const comparacaoPdf = comparada && deltas.length ? { data: comparada.data, itens: deltas } : null;

  const baixar = async () => {
    if (!av) return;
    const { gerarPdfAvaliacao } = await import('../../lib/avaliacaoPdf');
    baixarBlob(gerarPdfAvaliacao(av.pdfDados, secoes, comparacaoPdf), nomeArquivoDe(av));
  };

  const compartilhar = async () => {
    if (!av) return;
    const { gerarPdfAvaliacao } = await import('../../lib/avaliacaoPdf');
    const blob = gerarPdfAvaliacao(av.pdfDados, secoes, comparacaoPdf);
    const nomeArquivo = nomeArquivoDe(av);
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
    <Modal
      open={modalAvaliacaoDetalhe && !!av}
      onClose={fecharModal}
      title={`Avaliação de ${av?.data ?? ''}`}
      actions={<Button variant="secondary" onClick={fecharModal}>Fechar</Button>}
    >
      {av && (
        <>
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

          {outrasAvaliacoes.length > 0 && (
            <div className="field">
              <label>Comparar com</label>
              <select className="input" value={compararComId} onChange={(e) => setCompararComId(e.target.value)}>
                <option value="">Nenhuma comparação</option>
                {outrasAvaliacoes.map((x) => <option key={x.id} value={x.id}>{x.data}</option>)}
              </select>
            </div>
          )}

          {deltas.length > 0 && (
            <div className="card" style={{ gap: 6 }}>
              <div className="card-kicker">Diferença desde {comparada?.data}</div>
              {deltas.map((d) => (
                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid color-mix(in srgb, var(--color-text) 6%, transparent)', paddingBottom: 5 }}>
                  <span style={{ color: 'var(--color-neutral-600)' }}>{d.label}</span>
                  <span style={{ fontFamily: 'var(--font-heading)' }}>{(d.delta >= 0 ? '+' : '') + d.delta.toFixed(1) + (d.unidade ? ' ' + d.unidade : '')}</span>
                </div>
              ))}
            </div>
          )}

          <div className="field">
            <label>O que mandar no PDF</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SECOES_LABELS.map((s) => (
                <div
                  key={s.key}
                  onClick={() => toggleSecao(s.key)}
                  className={'tag ' + (secoes[s.key] ? 'tag-accent' : 'tag-outline')}
                  style={{ cursor: 'pointer' }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={baixar}>Baixar PDF</Button>
            <Button variant="primary" style={{ flex: 1 }} onClick={compartilhar}>Enviar por WhatsApp</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

function nomeArquivoDe(av: NonNullable<ReturnType<typeof useApp>['avaliacaoDetalheAtual']>): string {
  return 'avaliacao-' + av.pdfDados.alunoNome.replace(/\s+/g, '-').toLowerCase() + '-' + av.data.replace(/\//g, '-') + '.pdf';
}
