import { useApp } from '../../state/AppContext';
import { BlueprintCard } from '../BlueprintCard';

export function CobrancaModal() {
  const { modalCobranca, cobrando, msg, setMsg, fecharModal, enviarCobranca } = useApp();
  if (!modalCobranca) return null;
  return (
    <div className="dialog-backdrop" style={{ zIndex: 80 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)' }}>
        <div className="dialog-title">Cobrar {cobrando.nome}</div>
        <div className="field">
          <label>Mensagem</label>
          <textarea className="input" value={msg} onChange={(e) => setMsg(e.target.value)} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>Vai por WhatsApp para {cobrando.fone}.</div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={enviarCobranca}>Enviar</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
