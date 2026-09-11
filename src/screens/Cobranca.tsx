import { useApp } from '../state/AppContext';
import { BlueprintCard } from '../components/BlueprintCard';

export function Cobranca() {
  const { cobranca } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div>
        <h2 style={{ fontSize: 29, margin: 0 }}>Cobrança</h2>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{cobranca.frase}</div>
      </div>
      {cobranca.porAluno.map((al) => (
        <BlueprintCard key={al.id} style={{ gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 16, fontFamily: 'var(--font-heading)' }}>{al.nome}</div>
            {al.itens.length > 1 && <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{al.totalFmt}</div>}
          </div>
          {al.itens.map((c) => (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: al.itens.length > 1 ? '1px solid var(--color-divider)' : undefined, paddingTop: al.itens.length > 1 ? 8 : 0, borderLeft: `3px solid ${c.borda}`, paddingLeft: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{c.detalhe}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: al.itens.length > 1 ? 14 : 20 }}>{c.valor}</div>
                  <span className={c.tagClass}>{c.tagTexto}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={c.cobrar}>{c.botao}</button>
                <button className="btn btn-secondary" onClick={c.baixar}>Recebi</button>
              </div>
            </div>
          ))}
        </BlueprintCard>
      ))}
      {cobranca.vazio && (
        <BlueprintCard style={{ gap: 'var(--space-2)' }}>
          <div className="card-kicker">Tudo em ordem</div>
          <div style={{ fontSize: 14 }}>Ninguém em atraso agora. Mês limpo — aproveita e fecha o caixa.</div>
        </BlueprintCard>
      )}
      <div className="card" style={{ gap: 'var(--space-2)' }}>
        <div className="card-kicker">Como você cobra</div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', lineHeight: 1.5 }}>
          Mensagem pronta com nome, valor do mês e o que gerou desconto — você revisa antes de enviar. Depois de 3 dias sem resposta, o app te lembra de novo.
        </div>
      </div>
      <div style={{ height: 6 }} />
    </div>
  );
}
