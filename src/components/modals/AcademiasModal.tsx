import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function AcademiasModal() {
  const { modalAcademias, academiasResumo, custoAcademiasFmt, abrirNovaAcademia, fecharModal } = useApp();
  return (
    <Modal
      open={modalAcademias}
      onClose={fecharModal}
      title="Academias"
      actions={<Button variant="primary" onClick={fecharModal}>Pronto</Button>}
    >
      <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>custo total {custoAcademiasFmt}/mês</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {academiasResumo.map((ac) => (
          <div key={ac.id} className="card" style={{ gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{ac.nome}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{ac.custoMensalFmt}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
              {ac.modeloTexto} · {ac.valorCobradoFmt} · deslocamento {ac.deslocTexto} · {ac.nAtivos} aluno(s) ativo(s)
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 2 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={ac.editar}>Editar</Button>
              <Button variant="secondary" onClick={ac.excluir}>Excluir</Button>
            </div>
          </div>
        ))}
        {academiasResumo.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Nenhuma academia cadastrada ainda.</div>
        )}
      </div>
      <Button variant="secondary" block onClick={abrirNovaAcademia}>+ Nova academia</Button>
    </Modal>
  );
}
