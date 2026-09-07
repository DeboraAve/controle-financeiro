import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Field, TextArea } from '../ui/Field';
import { Modal } from '../ui/Modal';

export function CobrancaModal() {
  const { modalCobranca, cobrando, msg, setMsg, fecharModal, enviarCobranca } = useApp();
  return (
    <Modal
      open={modalCobranca}
      onClose={fecharModal}
      title={`Cobrar ${cobrando.nome}`}
      actions={
        <>
          <Button variant="secondary" onClick={fecharModal}>Cancelar</Button>
          <Button variant="primary" onClick={enviarCobranca}>Enviar</Button>
        </>
      }
    >
      <Field label="Mensagem">
        <TextArea value={msg} onChange={(e) => setMsg(e.target.value)} />
      </Field>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Vai por WhatsApp para {cobrando.fone}.</div>
    </Modal>
  );
}
