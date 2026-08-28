import { useApp } from '../../state/AppContext';
import { BlueprintCard } from '../BlueprintCard';

export function InativarModal() {
  const { modalInativar, aluno, fecharModal, confirmarInativar } = useApp();
  if (!modalInativar || !aluno) return null;
  return (
    <div className="dialog-backdrop" style={{ zIndex: 80 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)' }}>
        <div className="dialog-title">Inativar {aluno.nome}?</div>
        <div className="dialog-body">
          Ele sai da lista ativa e para de gerar cobrança, mas o histórico de pagamentos e aulas fica guardado. Dá pra reativar quando ele voltar.
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={fecharModal}>Voltar</button>
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={confirmarInativar}>Inativar</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
