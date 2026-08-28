import { useApp } from '../state/AppContext';

export function Alunos() {
  const { filtros, listaAlunos, busca, setBusca, contagem } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <h2 style={{ fontSize: 29, margin: 0 }}>Alunos</h2>
      <input className="input" type="text" placeholder="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        {filtros.map((f) => (
          <label key={f.rotulo} className="seg-opt">
            <input type="radio" name="filtro" checked={f.on} onChange={f.set} />
            <span>{f.rotulo}</span>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {listaAlunos.map((a) => (
          <div key={a.id} onClick={a.abrir} className="aluno-row">
            <div className="avatar-square" style={{ color: a.inicialCor }}>{a.inicial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15 }}>{a.nome}</span><span className={a.tagClass}>{a.tagTexto}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.sub}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{a.totalFmt}</div>
              <div style={{ fontSize: 10, color: a.pagCor }}>{a.pagTexto}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{contagem}</div>
    </div>
  );
}
