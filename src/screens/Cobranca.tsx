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
      {cobranca.lista.map((c) => (
        <BlueprintCard key={c.id} style={{ gap: 'var(--space-2)', borderColor: c.borda }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-heading)' }}>{c.nome}</div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{c.detalhe}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>{c.valor}</div>
              <span className={c.tagClass}>{c.tagTexto}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 2 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={c.cobrar}>{c.botao}</button>
            <button className="btn btn-secondary" onClick={c.baixar}>Recebi</button>
          </div>
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
