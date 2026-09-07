import { useState } from 'react';
import { useApp } from '../../state/AppContext';
import { useAuth } from '../../state/AuthContext';
import { BlueprintCard } from '../BlueprintCard';
import { aplicarTema, lerTema, type Tema } from '../../lib/theme';

const GRAFICOS = ['Barras mensais', 'Linha de caixa', 'Anel de recebimento'] as const;
const TEMAS: { v: Tema; rotulo: string }[] = [
  { v: 'system', rotulo: 'Sistema' },
  { v: 'light', rotulo: 'Claro' },
  { v: 'dark', rotulo: 'Escuro' },
];

export function AjustesModal() {
  const { modalAjustes, fecharModal, isGestao, grafico, setGrafico, metaMensal, setMetaMensal, diasParaAtraso, setDiasParaAtraso } = useApp();
  const { session, isAdmin, signOut } = useAuth();
  const [tema, setTema] = useState<Tema>(lerTema);
  if (!modalAjustes) return null;
  const escolherTema = (t: Tema) => {
    setTema(t);
    aplicarTema(t);
  };
  return (
    <div className="dialog-backdrop" style={{ zIndex: 80 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)' }}>
        <div className="dialog-title">Ajustes</div>
        <div className="field">
          <label>Aparência</label>
          <div className="seg" style={{ display: 'flex' }}>
            {TEMAS.map((t) => (
              <label key={t.v} className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
                <input type="radio" name="tema" checked={tema === t.v} onChange={() => escolherTema(t.v)} />
                <span>{t.rotulo}</span>
              </label>
            ))}
          </div>
        </div>
        {!isGestao && (
          <>
            <div className="field">
              <label>Gráfico do painel</label>
              <div className="seg" style={{ display: 'flex' }}>
                {GRAFICOS.map((g) => (
                  <label key={g} className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
                    <input type="radio" name="grafico" checked={grafico === g} onChange={() => setGrafico(g)} />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Meta do mês (R$)</label>
              <input
                className="input"
                type="number"
                min={0}
                step={250}
                value={metaMensal}
                onChange={(e) => setMetaMensal(Math.max(0, parseInt(e.target.value || '0', 10)))}
              />
            </div>
            <div className="field">
              <label>Dias até virar atraso</label>
              <input
                className="input"
                type="number"
                min={1}
                step={1}
                value={diasParaAtraso}
                onChange={(e) => setDiasParaAtraso(Math.max(1, parseInt(e.target.value || '1', 10)))}
              />
            </div>
          </>
        )}
        <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', borderTop: '1px solid var(--color-divider)', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          Logado como {session?.user.email}
          <span className={isAdmin ? 'tag tag-accent' : 'tag tag-neutral'} style={{ fontSize: 9 }}>{isAdmin ? 'admin' : 'personal'}</span>
        </div>
        <div className="dialog-actions" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={signOut}>Sair da conta</button>
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={fecharModal}>Pronto</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
