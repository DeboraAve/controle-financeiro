import { useApp } from '../state/AppContext';
import { useAuth } from '../state/AuthContext';
import { BlueprintCard } from '../components/BlueprintCard';

export function GestaoPersonais() {
  const { personaisResumo, abrirAjustes } = useApp();
  const { session } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">Gestão</div>
          <h2 style={{ fontSize: 29, margin: '2px 0 0' }}>Personais</h2>
        </div>
        <div className="avatar-badge" onClick={abrirAjustes} title="Ajustes">⚙</div>
      </div>

      {personaisResumo.length === 0 && (
        <BlueprintCard style={{ gap: 'var(--space-2)' }}>
          <div className="card-kicker">Nenhum personal ainda</div>
          <div style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>
            Assim que alguém criar uma conta pelo app, ela aparece aqui pra você acompanhar.
          </div>
        </BlueprintCard>
      )}

      {personaisResumo.map((p) => (
        <BlueprintCard key={p.id} style={{ gap: 'var(--space-2)' }}>
          <div onClick={p.entrar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{p.nome}</div>
              {p.atrasados > 0 && <span className="tag tag-outline">{p.atrasados} atrasado(s)</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{p.email}</div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 13, borderTop: '1px solid var(--color-divider)', paddingTop: 8 }}>
              <div>
                <div className="stat-label">Alunos ativos</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{p.alunosAtivos}</div>
              </div>
              <div>
                <div className="stat-label">Receita prevista</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{p.receitaFmt}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-accent-700)' }}>Entrar na conta →</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderTop: '1px solid var(--color-divider)', paddingTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="card-kicker">Mensalidade do app</div>
              <span className={p.mensalidadeTagClass}>{p.mensalidadeTagTexto}</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Valor (R$)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={p.mensalidadeValor}
                  onChange={(e) => p.setMensalidadeValor(Math.max(0, parseInt(e.target.value || '0', 10)))}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Telefone</label>
                <input className="input" value={p.fone} onChange={(e) => p.setFone(e.target.value)} placeholder="(11) 9 0000-0000" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={p.cobrarMensalidade}>Cobrar</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={p.receberMensalidade}>Recebi</button>
            </div>
          </div>
        </BlueprintCard>
      ))}

      <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>Logado como {session?.user.email}</div>
      <div style={{ height: 6 }} />
    </div>
  );
}
