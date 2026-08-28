import { useApp } from '../../state/AppContext';
import { BlueprintCard } from '../BlueprintCard';

export function AcademiasModal() {
  const { modalAcademias, academiasResumo, custoAcademiasFmt, abrirNovaAcademia, fecharModal } = useApp();
  if (!modalAcademias) return null;
  return (
    <div className="dialog-backdrop" style={{ zIndex: 80 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)', width: 'min(520px, 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="dialog-title">Academias</div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>custo total {custoAcademiasFmt}/mês</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '48vh', overflow: 'auto' }}>
          {academiasResumo.map((ac) => (
            <div key={ac.id} className="card" style={{ gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{ac.nome}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{ac.custoMensalFmt}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
                {ac.modeloTexto} · {ac.valorCobradoFmt} · deslocamento {ac.deslocTexto} · {ac.nAtivos} aluno(s) ativo(s)
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 2 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={ac.editar}>Editar</button>
                <button className="btn btn-secondary" onClick={ac.excluir}>Excluir</button>
              </div>
            </div>
          ))}
          {academiasResumo.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Nenhuma academia cadastrada ainda.</div>
          )}
        </div>
        <button className="btn btn-secondary btn-block" onClick={abrirNovaAcademia}>+ Nova academia</button>
        <div className="dialog-actions">
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={fecharModal}>Pronto</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
