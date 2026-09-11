import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function CobrarTodosModal() {
  const { modalCobrarTodosConfirmar, cobranca, fecharModal } = useApp();
  return (
    <Modal
      open={modalCobrarTodosConfirmar}
      onClose={fecharModal}
      title="Cobrar todo mundo agora?"
      actions={
        <>
          <Button variant="secondary" onClick={fecharModal}>Voltar</Button>
          <Button variant="primary" onClick={cobranca.cobrarTodos}>Cobrar todos</Button>
        </>
      }
    >
      <div className="dialog-body">
        Abre uma aba do WhatsApp pra cada um dos {cobranca.porAluno.length} aluno(s) em aberto, já com a mensagem pronta — o navegador pode pedir permissão pra abrir várias abas de uma vez, é só permitir. Cada um vai pra "cobrado" assim que a aba abrir, mesmo antes de você apertar enviar lá no WhatsApp.
      </div>
    </Modal>
  );
}
