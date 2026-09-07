import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { Stack } from '../ui/Stack';

export function FeriasModal() {
  const { modalFerias, aluno, presetsFerias, feriasValor, setFeriasValor, feriasPreview, fecharModal, confirmarFerias } = useApp();
  return (
    <Modal
      open={modalFerias && !!aluno}
      onClose={fecharModal}
      title={`Férias de ${aluno?.nome ?? ''}`}
      actions={
        <>
          <Button variant="secondary" onClick={fecharModal}>Cancelar</Button>
          <Button variant="primary" onClick={confirmarFerias}>Marcar férias</Button>
        </>
      }
    >
      <div className="dialog-body">Quanto descontar do pacote deste mês? O histórico e o pacote continuam intactos.</div>
      <Stack direction="row" gap={2}>
        {presetsFerias.map((p) => (
          <div key={p.rotulo} onClick={p.usar} className={p.classe} style={{ cursor: 'pointer', flex: 1, justifyContent: 'center', padding: '8px 4px' }}>
            {p.rotulo}
          </div>
        ))}
      </Stack>
      <Field label="Desconto (R$)">
        <Input value={feriasValor} onChange={(e) => setFeriasValor(e.target.value)} />
      </Field>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Fica {feriasPreview} a receber neste mês.</div>
    </Modal>
  );
}
