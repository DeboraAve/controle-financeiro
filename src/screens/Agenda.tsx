import { useApp } from '../state/AppContext';
import { BlueprintCard } from '../components/BlueprintCard';

export function Agenda() {
  const {
    semana, diasMes, dia, agendaView, verSemana, verMes,
    semanaAtual, temSemanaAnterior, temSemanaSeguinte, semanaAnterior, semanaSeguinte, irParaHoje, resumoSemana,
  } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ fontSize: 29, margin: 0 }}>Agenda</h2>
        <div className="seg" style={{ display: 'flex' }}>
          <label className="seg-opt" style={{ justifyContent: 'center' }}>
            <input type="radio" name="agendaView" checked={agendaView === 'semana'} onChange={verSemana} /><span>Semana</span>
          </label>
          <label className="seg-opt" style={{ justifyContent: 'center' }}>
            <input type="radio" name="agendaView" checked={agendaView === 'mes'} onChange={verMes} /><span>Mês</span>
          </label>
        </div>
      </div>

      {agendaView === 'semana' ? (
        <BlueprintCard style={{ gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <button className="btn btn-ghost" style={{ padding: 0, fontSize: 12 }} onClick={semanaAnterior} disabled={!temSemanaAnterior}>← semana</button>
            <button className="btn btn-ghost" style={{ padding: 0, fontSize: 11 }} onClick={irParaHoje}>hoje</button>
            <button className="btn btn-ghost" style={{ padding: 0, fontSize: 12 }} onClick={semanaSeguinte} disabled={!temSemanaSeguinte}>semana →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
            {semanaAtual.map((d) => (
              <div
                key={d.key}
                onClick={d.selecionar}
                style={{ border: `1px solid ${d.borda}`, background: d.fundo, color: d.cor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: d.cursor, padding: '10px 2px' }}
              >
                <div style={{ fontSize: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>{d.rotulo}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{d.n}</div>
                <div style={{ fontSize: 8 }}>{d.valor}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', borderTop: '1px solid var(--color-divider)', paddingTop: 8 }}>{resumoSemana}</div>
        </BlueprintCard>
      ) : (
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
      )}

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
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14 }}>{s.valor}</div>
              <span className={s.statusClasse} style={{ cursor: 'pointer' }} onClick={s.toggle}>{s.statusTexto}</span>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{dia.rodape}</div>
      </BlueprintCard>
      <div style={{ height: 6 }} />
    </div>
  );
}
