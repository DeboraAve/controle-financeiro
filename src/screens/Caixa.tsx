import { useApp } from '../state/AppContext';
import { BlueprintCard } from '../components/BlueprintCard';

export function Caixa() {
  const {
    resumo, categorias, despValor, despDesc, setDespValor, setDespDesc, despPreview, addDespesa, despesas,
    academiasResumo, abrirAcademias,
  } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <h2 style={{ fontSize: 29, margin: 0 }}>Caixa</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-2)' }}>
        <div className="card" style={{ gap: 2, padding: 'var(--space-3) var(--space-2)' }}>
          <div className="stat-label">Entradas</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{resumo.recebido}</div>
        </div>
        <div className="card" style={{ gap: 2, padding: 'var(--space-3) var(--space-2)' }}>
          <div className="stat-label">Saídas</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{resumo.despesas}</div>
        </div>
        <div className="card" style={{ gap: 2, padding: 'var(--space-3) var(--space-2)', borderColor: 'var(--color-accent)' }}>
          <div className="stat-label" style={{ color: 'var(--color-accent-700)' }}>Saldo</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{resumo.saldo}</div>
        </div>
      </div>

      <BlueprintCard style={{ gap: 'var(--space-3)' }}>
        <div className="card-kicker">Lançar despesa</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categorias.map((c) => (
            <div key={c.nome} onClick={c.escolher} className={c.classe} style={{ cursor: 'pointer' }}>{c.nome}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="field" style={{ width: 130 }}>
            <label>Valor (R$)</label>
            <input className="input" type="text" placeholder="0,00" value={despValor} onChange={(e) => setDespValor(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Descrição</label>
            <input className="input" type="text" placeholder="Ex.: caneleiras 2kg" value={despDesc} onChange={(e) => setDespDesc(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={addDespesa}>Lançar {despPreview}</button>
      </BlueprintCard>

      <BlueprintCard style={{ gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="card-kicker">Setembro · saídas soltas</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>toque pra editar</div>
        </div>
        {despesas.map((d) => (
          <div
            key={d.id}
            onClick={d.editar}
            style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid color-mix(in srgb, var(--color-text) 7%, transparent)', paddingBottom: 7 }}
          >
            <div style={{ width: 34, fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--color-accent-700)' }}>{d.dia}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14 }}>{d.desc}</div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{d.cat}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14 }}>− {d.valor}</div>
          </div>
        ))}
        {despesas.length === 0 && <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Nenhuma despesa solta lançada ainda.</div>}
      </BlueprintCard>

      <BlueprintCard style={{ gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="card-kicker">Custo fixo das academias</div>
          <button className="btn btn-ghost" style={{ padding: 0, fontSize: 11 }} onClick={abrirAcademias}>gerenciar</button>
        </div>
        {academiasResumo.filter((ac) => ac.nAtivos > 0).map((ac) => (
          <div key={ac.id} style={{ display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid color-mix(in srgb, var(--color-text) 7%, transparent)', paddingBottom: 7 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14 }}>{ac.nome}</div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{ac.modeloTexto} · {ac.nAtivos} aluno(s)</div>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14 }}>− {ac.custoMensalFmt}</div>
          </div>
        ))}
        {academiasResumo.filter((ac) => ac.nAtivos > 0).length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Nenhuma academia com aluno ativo agora.</div>
        )}
      </BlueprintCard>
      <div style={{ height: 6 }} />
    </div>
  );
}
