import { useApp } from '../../state/AppContext';
import type { TreinoPdfDados } from '../../lib/treinoPdf';
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

export function TreinoDetalheModal() {
  const { modalTreinoDetalhe, treinoDetalheAtual: t, aluno, excluirTreino, fecharModal } = useApp();

  const pdfDados = (): TreinoPdfDados | null => {
    if (!t || !aluno) return null;
    return {
      alunoNome: aluno.nome,
      nome: t.nome,
      data: t.dataFmt,
      dias: t.dias.map((d) => ({ nome: d.nome, itens: d.itens.map((it) => ({ exercicioNome: it.exercicioNome, resumo: it.resumo, observacoes: it.observacoes })) })),
    };
  };

  const nomeArquivo = () => 'treino-' + (aluno?.nome ?? '').replace(/\s+/g, '-').toLowerCase() + '.pdf';

  const baixar = async () => {
    const dados = pdfDados();
    if (!dados) return;
    const { gerarPdfTreino } = await import('../../lib/treinoPdf');
    baixarBlob(gerarPdfTreino(dados), nomeArquivo());
  };

  const compartilhar = async () => {
    const dados = pdfDados();
    if (!dados) return;
    const { gerarPdfTreino } = await import('../../lib/treinoPdf');
    const blob = gerarPdfTreino(dados);
    const nomeArq = nomeArquivo();
    const file = new File([blob], nomeArq, { type: 'application/pdf' });
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Treino', text: 'Treino de ' + dados.alunoNome });
        return;
      } catch {
        // cancelou ou não deu — cai pro download
      }
    }
    baixarBlob(blob, nomeArq);
  };

  return (
    <Modal
      open={modalTreinoDetalhe && !!t}
      onClose={fecharModal}
      title={t?.nome || 'Treino'}
      actions={<Button variant="secondary" onClick={fecharModal}>Fechar</Button>}
    >
      {t && (
        <>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
            {t.status === 'ativo' ? 'Treino ativo' : 'Arquivado'} · montado em {t.dataFmt}
          </div>

          {t.dias.map((d) => (
            <div key={d.id} className="card" style={{ gap: 6 }}>
              <div className="card-kicker">{d.nome || 'Treino'}</div>
              {d.itens.map((it) => (
                <div key={it.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, borderBottom: '1px solid color-mix(in srgb, var(--color-text) 6%, transparent)', paddingBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontFamily: 'var(--font-heading)' }}>{it.exercicioNome}</span>
                    <span style={{ color: 'var(--color-neutral-600)', fontSize: 11 }}>{it.resumo}</span>
                  </div>
                  {it.observacoes && <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{it.observacoes}</div>}
                </div>
              ))}
              {d.itens.length === 0 && <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>Nenhum exercício nesse dia.</div>}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={baixar}>Baixar PDF</Button>
            <Button variant="primary" style={{ flex: 1 }} onClick={compartilhar}>Enviar por WhatsApp</Button>
          </div>
          <Button variant="secondary" block onClick={() => excluirTreino(t.id)}>Excluir treino</Button>
        </>
      )}
    </Modal>
  );
}
