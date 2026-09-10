import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function FecharMesModal() {
  const { modalFecharMes, fecharModal, fecharMesQtdAlunos, fecharMesTotalFmt, fecharMesNome, confirmarFecharMes } = useApp();
  return (
    <Modal
      open={modalFecharMes}
      onClose={fecharModal}
      title={`Fechar ${fecharMesNome}?`}
      actions={
        <>
          <Button variant="secondary" onClick={fecharModal}>Cancelar</Button>
          <Button variant="primary" onClick={confirmarFecharMes}>Fechar o mês</Button>
        </>
      }
    >
      <div className="dialog-body">
        Isso registra o valor real de {fecharMesQtdAlunos} aluno(s) — {fecharMesTotalFmt} no total — como o fechamento definitivo de {fecharMesNome}, e reseta férias, cancelamentos e aulas extra pra virar a página. Não tem como desfazer isso depois; se for só corrigir um ajuste no meio do mês, use "Zerar ajustes" no aluno em vez disso.
      </div>
    </Modal>
  );
}
