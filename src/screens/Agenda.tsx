import { useApp } from '../state/AppContext';
import { BlueprintCard } from '../components/BlueprintCard';

export function Agenda() {
  const { semana, diasMes, dia } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ fontSize: 29, margin: 0 }}>Agenda</h2>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>Setembro 2026</div>
      </div>
      <BlueprintCard style={{ gap: 'var(--space-2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, fontSize: 9, color: 'var(--color-neutral-600)', textAlign: 'center' }}>
          {semana.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {diasMes.map((d) => (
            <div
              key={d.key}
              onClick={d.selecionar}
              style={{ aspectRatio: '1', border: `1px solid ${d.borda}`, background: d.fundo, color: d.cor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: d.cursor }}
            >
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12 }}>{d.n}</div>
              <div style={{ fontSize: 7, letterSpacing: '.02em' }}>{d.valor}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 10, color: 'var(--color-neutral-600)', borderTop: '1px solid var(--color-divider)', paddingTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, background: 'var(--color-accent-200)', border: '1px solid var(--color-accent)' }} />com aulas</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, background: 'var(--color-accent-800)' }} />selecionado</span>
        </div>
      </BlueprintCard>
      <BlueprintCard style={{ gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="card-kicker">{dia.titulo}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{dia.total}</div>
        </div>
        {dia.aulas.map((s) => (
          <div key={s.key} style={{ display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid color-mix(in srgb, var(--color-text) 7%, transparent)', paddingBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, width: 42, color: 'var(--color-accent-700)' }}>{s.hora}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14 }}>{s.nome}</div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{s.nota}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14 }}>{s.valor}</div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{dia.rodape}</div>
      </BlueprintCard>
      <div style={{ height: 6 }} />
    </div>
  );
}
