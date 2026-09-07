import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function InativarModal() {
  const { modalInativar, aluno, fecharModal, confirmarInativar } = useApp();
  return (
    <Modal
      open={modalInativar && !!aluno}
      onClose={fecharModal}
      title={`Inativar ${aluno?.nome ?? ''}?`}
      actions={
        <>
          <Button variant="secondary" onClick={fecharModal}>Voltar</Button>
          <Button variant="primary" onClick={confirmarInativar}>Inativar</Button>
        </>
      }
    >
      <div className="dialog-body">
        Ele sai da lista ativa e para de gerar cobrança, mas o histórico de pagamentos e aulas fica guardado. Dá pra reativar quando ele voltar.
      </div>
    </Modal>
  );
}
