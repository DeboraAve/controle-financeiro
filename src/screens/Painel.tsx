import { useApp } from '../state/AppContext';
import { useAuth } from '../state/AuthContext';
import { BlueprintCard } from '../components/BlueprintCard';

function iniciaisDe(nome: string | undefined, email: string | undefined): string {
  if (nome && nome.trim()) {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    return partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '??';
  }
  return (email ?? '??').slice(0, 2).toUpperCase();
}

export function Painel() {
  const { resumo, meses, viz, topAlunos, irCobranca, abrirAjustes } = useApp();
  const { session } = useAuth();
  const inicial = iniciaisDe(session?.user.user_metadata?.nome as string | undefined, session?.user.email);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">Setembro 2026</div>
          <h2 style={{ fontSize: 29, margin: '2px 0 0' }}>Bora fechar o mês</h2>
        </div>
        <div className="avatar-badge" onClick={abrirAjustes} title="Ajustes">{inicial}</div>
      </div>

      <BlueprintCard style={{ gap: 'var(--space-2)', padding: 'var(--space-4)' }}>
        <div className="card-kicker">Fechamento previsto</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 44, lineHeight: 1 }}>{resumo.previsto}</div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>de {resumo.base} em pacotes</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
          <div style={{ height: 8, background: 'var(--color-neutral-200)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '0 auto 0 0', background: 'var(--color-accent)', width: `${resumo.metaPct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-neutral-700)' }}>
            <span>{resumo.metaFrase}</span><span>meta {resumo.meta}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', fontSize: 12, color: 'var(--color-neutral-700)', borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-2)' }}>
          <span>− {resumo.descontos} desconto</span><span style={{ color: 'var(--color-divider)' }}>|</span><span>+ {resumo.extras} extras</span>
        </div>
      </BlueprintCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-2)' }}>
        <div className="card" style={{ gap: 2, padding: 'var(--space-3) var(--space-2)' }}>
          <div className="stat-label">Recebido</div>
          <div className="stat-value">{resumo.recebido}</div>
          <div className="stat-sub">{resumo.pagos} alunos</div>
        </div>
        <div className="card" style={{ gap: 2, padding: 'var(--space-3) var(--space-2)' }}>
          <div className="stat-label">A receber</div>
          <div className="stat-value">{resumo.aberto}</div>
          <div className="stat-sub">{resumo.abertos} em aberto</div>
        </div>
        <div className="card" style={{ gap: 2, padding: 'var(--space-3) var(--space-2)', borderColor: 'var(--color-accent)' }}>
          <div className="stat-label" style={{ color: 'var(--color-accent-700)' }}>Atrasado</div>
          <div className="stat-value" style={{ color: 'var(--color-accent-800)' }}>{resumo.atrasado}</div>
          <div className="stat-sub">{resumo.atrasados} aluno(s)</div>
        </div>
      </div>

      <BlueprintCard style={{ gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="card-kicker">{viz.titulo}</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{viz.legenda}</div>
        </div>

        {viz.barras && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 112 }}>
            {meses.map((m) => (
              <div key={m.nome} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 9, color: 'var(--color-neutral-600)' }}>{m.rotulo}</div>
                <div style={{ width: '100%', background: m.cor, height: m.h, border: `1px solid ${m.borda}` }} />
                <div style={{ fontSize: 10, fontFamily: 'var(--font-heading)', color: m.texto }}>{m.nome}</div>
              </div>
            ))}
          </div>
        )}

        {viz.linha && (
          <div>
            <div style={{ position: 'relative', height: 112, borderBottom: '1px solid var(--color-divider)', borderLeft: '1px solid var(--color-divider)' }}>
              <svg viewBox="0 0 300 110" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                <polyline points={viz.pontos} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
                <polyline points={viz.pontosProj} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="5 4" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-neutral-600)', marginTop: 5 }}>
              {meses.map((m) => <span key={m.nome}>{m.nome}</span>)}
            </div>
          </div>
        )}

        {viz.anel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 118, height: 118, flex: 'none', borderRadius: '50%', background: viz.anelGrad, display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 82, height: 82, borderRadius: '50%', background: 'var(--color-bg)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>{resumo.recebidoPct}%</div>
                  <div style={{ fontSize: 9, color: 'var(--color-neutral-600)' }}>recebido</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 10, height: 10, background: 'var(--color-accent-800)' }} />Recebido {resumo.recebido}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 10, height: 10, background: 'var(--color-accent-400)' }} />Em aberto {resumo.aberto}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 10, height: 10, background: 'var(--color-neutral-300)' }} />Atrasado {resumo.atrasado}</div>
            </div>
          </div>
        )}
      </BlueprintCard>

      <BlueprintCard style={{ gap: 'var(--space-3)' }}>
        <div className="card-kicker">Quem sustenta o mês</div>
        {topAlunos.map((a) => (
          <div key={a.nome} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>{a.nome}</span><span style={{ fontFamily: 'var(--font-heading)' }}>{a.totalFmt}</span>
            </div>
            <div style={{ height: 5, background: 'var(--color-neutral-200)' }}><div style={{ height: '100%', background: 'var(--color-accent)', width: `${a.pct}%` }} /></div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{resumo.concentracao}</div>
      </BlueprintCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
        <div className="card" style={{ gap: 2 }}>
          <div className="stat-label">Despesas</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{resumo.despesas}</div>
          <div className="stat-sub">{resumo.qtdDespesas} lançamentos</div>
        </div>
        <div className="card" style={{ gap: 2, borderColor: 'var(--color-accent)' }}>
          <div className="stat-label" style={{ color: 'var(--color-accent-700)' }}>Lucro previsto</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{resumo.lucro}</div>
          <div className="stat-sub">margem {resumo.margem}%</div>
        </div>
      </div>

      <BlueprintCard style={{ gap: 'var(--space-2)', borderColor: 'var(--color-accent)' }}>
        <div className="card-kicker">Precisa de você</div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>{resumo.alerta}</div>
        <button className="btn btn-primary btn-block" onClick={irCobranca}>Abrir cobranças</button>
      </BlueprintCard>
      <div style={{ height: 6 }} />
    </div>
  );
}
