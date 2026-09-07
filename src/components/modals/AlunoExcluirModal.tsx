import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function AlunoExcluirModal() {
  const { modalAlunoExcluir, aluno, fecharModal, confirmarExcluirAluno } = useApp();
  return (
    <Modal
      open={modalAlunoExcluir && !!aluno}
      onClose={fecharModal}
      title={`Excluir ${aluno?.nome ?? ''} de vez?`}
      danger
      actions={
        <>
          <Button variant="secondary" onClick={fecharModal}>Cancelar</Button>
          <Button variant="primary" onClick={confirmarExcluirAluno}>Excluir de vez</Button>
        </>
      }
    >
      <div className="dialog-body">
        Isso apaga o cadastro e todo o histórico dele — diferente de inativar, aqui não tem como desfazer. Se é só uma pausa, use "Inativar aluno" em vez disso.
      </div>
    </Modal>
  );
}
