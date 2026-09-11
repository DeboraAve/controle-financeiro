import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../../state/AppContext';
import { compararAvaliacoes, type DeltaCampo } from '../../lib/avaliacaoCalc';
import type { AvaliacaoPdfSecoes } from '../../lib/avaliacaoPdf';
import { abrirWhatsApp } from '../../lib/whatsapp';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { StepDots } from '../ui/StepDots';

const TOTAL_PASSOS = 2;

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
  const { modalAvaliacaoDetalhe, avaliacaoDetalheAtual, avaliacoes, aluno, fecharModal } = useApp();
  const av = avaliacaoDetalheAtual;

  const [compararComIds, setCompararComIds] = useState<Set<string>>(new Set());
  const [secoes, setSecoes] = useState<AvaliacaoPdfSecoes>({ gerais: true, composicao: true, dobras: true, perimetria: true, comparacao: true, observacoes: true });
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    if (!av) return;
    const idx = avaliacoes.findIndex((x) => x.id === av.id);
    const anterior = idx >= 0 ? avaliacoes[idx + 1] : undefined;
    setCompararComIds(anterior ? new Set([anterior.id]) : new Set());
    setPasso(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [av?.id]);

  const outrasAvaliacoes = av ? avaliacoes.filter((x) => x.id !== av.id) : [];
  // Mais de uma comparação marcada ao mesmo tempo — cada uma entra como uma
  // coluna de diferença própria, na mesma ordem em que aparece na lista
  // (mais recente primeiro), não na ordem que foi clicada.
  const comparadas = outrasAvaliacoes.filter((x) => compararComIds.has(x.id));
  const comparacoes = av ? comparadas.map((c) => ({ data: c.data, deltas: compararAvaliacoes(av.bruto, c.bruto) })) : [];
  const deltaPorLabel = new Map<string, { data: string; delta: DeltaCampo }[]>();
  for (const { data, deltas } of comparacoes) {
    for (const d of deltas) {
      const lista = deltaPorLabel.get(d.label) ?? [];
      lista.push({ data, delta: d });
      deltaPorLabel.set(d.label, lista);
    }
  }
  const toggleComparar = (id: string) => {
    setCompararComIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSecao = (key: keyof AvaliacaoPdfSecoes) => setSecoes((s) => ({ ...s, [key]: !s[key] }));

  // O PDF só leva uma comparação — usa a primeira marcada (mais recente).
  const primeiraComparacao = comparacoes[0];
  const comparacaoPdf = primeiraComparacao && primeiraComparacao.deltas.length ? { data: primeiraComparacao.data, itens: primeiraComparacao.deltas } : null;

  const baixar = async () => {
    if (!av) return;
    const { gerarPdfAvaliacao } = await import('../../lib/avaliacaoPdf');
    baixarBlob(await gerarPdfAvaliacao(av.pdfDados, secoes, comparacaoPdf), nomeArquivoDe(av));
  };

  const compartilhar = async () => {
    if (!av) return;
    const { gerarPdfAvaliacao } = await import('../../lib/avaliacaoPdf');
    const blob = await gerarPdfAvaliacao(av.pdfDados, secoes, comparacaoPdf);
    const nomeArquivo = nomeArquivoDe(av);
    const file = new File([blob], nomeArquivo, { type: 'application/pdf' });
    // O wa.me só abre o WhatsApp com texto pré-pronto — não existe jeito de
    // mandar um arquivo já anexado direto pro número (ver lib/whatsapp.ts).
    // Abre a conversa certa com um aviso curto, e ainda assim entrega o
    // PDF pelo share sheet — falta só anexar na conversa que já abriu, em
    // vez de precisar procurar o contato do zero.
    if (aluno?.fone) {
      abrirWhatsApp(aluno.fone, 'Oi, ' + aluno.nome.split(' ')[0] + '! Segue sua avaliação física em anexo.');
    }
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

  // Cartãozinho compacto em grade (2+ por linha) em vez de uma linha
  // inteira por medida — era isso que fazia até um passo só (5 medidas de
  // composição + 9 dobras) continuar exigindo rolagem por dentro.
  const tile = (label: string, valor: string) => {
    const ds = deltaPorLabel.get(label);
    return (
      <div key={label} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, overflowWrap: 'break-word' }}>{valor}</span>
        {ds?.map(({ data, delta: d }) => (
          <span key={data} style={{ fontSize: 10, color: d.delta === 0 ? 'var(--color-neutral-600)' : 'var(--color-accent-700)' }}>
            {(d.delta >= 0 ? '+' : '') + d.delta.toFixed(1) + (d.unidade ? ' ' + d.unidade : '')} · {data}
          </span>
        ))}
      </div>
    );
  };
  const grade = (children: ReactNode) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6 }}>{children}</div>
  );

  return (
    <Modal
      open={modalAvaliacaoDetalhe && !!av}
      onClose={fecharModal}
      title={`Avaliação de ${av?.data ?? ''}`}
      actions={
        <>
          <Button variant="secondary" onClick={passo === 0 ? fecharModal : () => setPasso(0)}>
            {passo === 0 ? 'Fechar' : 'Voltar'}
          </Button>
          {passo === 0 ? (
            <Button variant="primary" onClick={() => setPasso(1)}>Continuar</Button>
          ) : (
            <Button variant="primary" onClick={fecharModal}>Fechar</Button>
          )}
        </>
      }
    >
      {av && (
        <>
          <StepDots total={TOTAL_PASSOS} atual={passo} />

          {passo === 0 && (
            <>
              {outrasAvaliacoes.length > 0 && (
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Comparar com</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {outrasAvaliacoes.map((x) => (
                      <label
                        key={x.id}
                        className={'tag ' + (compararComIds.has(x.id) ? 'tag-accent' : 'tag-outline')}
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <input
                          type="checkbox"
                          checked={compararComIds.has(x.id)}
                          onChange={() => toggleComparar(x.id)}
                          style={{ margin: 0 }}
                        />
                        {x.data}
                      </label>
                    ))}
                  </div>
                  {comparadas.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 4 }}>
                      Diferença desde cada data marcada, entre parênteses, ao lado de cada valor.
                    </div>
                  )}
                </div>
              )}

              <div className="card" style={{ gap: 6 }}>
                <div className="card-kicker">Composição corporal</div>
                {grade(
                  <>
                    {tile('IMC', av.imcFmt + ' · ' + av.imcClasse)}
                    {tile('Risco à saúde', av.risco)}
                    {tile('% de gordura', av.percentualGorduraFmt)}
                    {tile('Massa magra', av.massaMagraFmt)}
                    {av.rcqFmt && tile('Relação cintura-quadril', av.rcqFmt)}
                  </>,
                )}
              </div>

              {av.pdfDados.dobras.length > 0 && (
                <div className="card" style={{ gap: 6 }}>
                  <div className="card-kicker">Dobras cutâneas</div>
                  {grade(av.pdfDados.dobras.map((c) => tile(c.label, c.valor)))}
                </div>
              )}

              {av.pdfDados.perimetria.length > 0 && (
                <div className="card" style={{ gap: 6 }}>
                  <div className="card-kicker">Perimetria</div>
                  {grade(av.pdfDados.perimetria.map((c) => tile(c.label, c.valor)))}
                </div>
              )}
            </>
          )}

          {passo === 1 && (
            <>
              {av.observacoes && (
                <div className="card" style={{ gap: 6 }}>
                  <div className="card-kicker">Observações</div>
                  <div style={{ fontSize: 13 }}>{av.observacoes}</div>
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
        </>
      )}
    </Modal>
  );
}

function nomeArquivoDe(av: NonNullable<ReturnType<typeof useApp>['avaliacaoDetalheAtual']>): string {
  return 'avaliacao-' + av.pdfDados.alunoNome.replace(/\s+/g, '-').toLowerCase() + '-' + av.data.replace(/\//g, '-') + '.pdf';
}
