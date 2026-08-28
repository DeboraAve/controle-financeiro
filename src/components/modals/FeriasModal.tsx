import { useApp } from '../../state/AppContext';
import { BlueprintCard } from '../BlueprintCard';

export function FeriasModal() {
  const { modalFerias, aluno, presetsFerias, feriasValor, setFeriasValor, feriasPreview, fecharModal, confirmarFerias } = useApp();
  if (!modalFerias || !aluno) return null;
  return (
    <div className="dialog-backdrop" style={{ zIndex: 80 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)' }}>
        <div className="dialog-title">Férias de {aluno.nome}</div>
        <div className="dialog-body">Quanto descontar do pacote deste mês? O histórico e o pacote continuam intactos.</div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {presetsFerias.map((p) => (
            <div key={p.rotulo} onClick={p.usar} className={p.classe} style={{ cursor: 'pointer', flex: 1, justifyContent: 'center', padding: '8px 4px' }}>
              {p.rotulo}
            </div>
          ))}
        </div>
        <div className="field">
          <label>Desconto (R$)</label>
          <input className="input" value={feriasValor} onChange={(e) => setFeriasValor(e.target.value)} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>Fica {feriasPreview} a receber neste mês.</div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={confirmarFerias}>Marcar férias</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
