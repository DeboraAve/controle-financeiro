import { useApp } from '../state/AppContext';
import { useSetPageHeader } from '../state/PageHeaderContext';
import { BlueprintCard } from '../components/BlueprintCard';

export function Cobranca() {
  const { cobranca, mesAtualNome, abrirConfirmarMarcarTodosRecebidos, abrirConfirmarCobrarTodos } = useApp();

  useSetPageHeader(
    <div>
      <h2 style={{ fontSize: 29, margin: 0 }}>Cobrança</h2>
      <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{cobranca.frase}</div>
    </div>,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {!cobranca.vazio && (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={abrirConfirmarMarcarTodosRecebidos}>Marcar tudo recebido</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={abrirConfirmarCobrarTodos}>Cobrar todos</button>
        </div>
      )}

      {cobranca.porAluno.map((al) => (
        <BlueprintCard key={al.id} style={{ gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 16, fontFamily: 'var(--font-heading)' }}>{al.nome}</div>
            {al.itens.length > 1 && <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{al.totalFmt}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {al.itens.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: 'var(--color-neutral-700)' }}>{c.id.startsWith('fechamento-') ? c.tagTexto : mesAtualNome}</span>
                  {!c.id.startsWith('fechamento-') && <span className={c.tagClass} style={{ fontSize: 9 }}>{c.tagTexto}</span>}
                </span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-heading)' }}>{c.valor}</span>
                  <button className="btn btn-ghost" style={{ padding: 0, fontSize: 11 }} onClick={c.baixar}>recebi</button>
                </span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={al.itens.length > 1 ? al.cobrarTudo : al.itens[0].cobrar}>
            {al.itens.length > 1 ? 'Cobrar tudo (' + al.totalFmt + ')' : al.itens[0].botao}
          </button>
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
