import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function MarcarTodosRecebidosModal() {
  const { modalMarcarTodosRecebidos, cobranca, fecharModal } = useApp();
  return (
    <Modal
      open={modalMarcarTodosRecebidos}
      onClose={fecharModal}
      title="Marcar tudo como recebido?"
      actions={
        <>
          <Button variant="secondary" onClick={fecharModal}>Voltar</Button>
          <Button variant="primary" onClick={cobranca.marcarTodosRecebidos}>Marcar tudo</Button>
        </>
      }
    >
      <div className="dialog-body">
        Marca {cobranca.frase.toLowerCase()} como pago, de uma vez só — sem enviar nenhuma mensagem. Use só quando já recebeu tudo de outro jeito (dinheiro, Pix direto) e só falta acertar no app.
      </div>
    </Modal>
  );
}
