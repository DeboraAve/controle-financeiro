import { useApp } from '../../state/AppContext';
import { BlueprintCard } from '../BlueprintCard';

export function AlunoExcluirModal() {
  const { modalAlunoExcluir, aluno, fecharModal, confirmarExcluirAluno } = useApp();
  if (!modalAlunoExcluir || !aluno) return null;
  return (
    <div className="dialog-backdrop" style={{ zIndex: 85 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-accent)' }}>
        <div className="dialog-title">Excluir {aluno.nome} de vez?</div>
        <div className="dialog-body">
          Isso apaga o cadastro e todo o histórico dele — diferente de inativar, aqui não tem como desfazer. Se é só uma pausa, use "Inativar aluno" em vez disso.
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={confirmarExcluirAluno}>Excluir de vez</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
