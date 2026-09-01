import { useMemo, useState } from 'react';
import { useApp, type AvaliacaoFormPayload } from '../../state/AppContext';
import { calcularAvaliacao } from '../../lib/avaliacaoCalc';
import { BlueprintCard } from '../BlueprintCard';

function hoje(): string {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

function campoNum(v: string): number | null {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function AvaliacaoFormModal() {
  const { modalAvaliacaoForm, aluno, salvarAvaliacao, fecharModal } = useApp();

  const [data, setData] = useState(hoje());
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F'>('F');
  const [dPeitoral, setDPeitoral] = useState('');
  const [dAxilar, setDAxilar] = useState('');
  const [dTriceps, setDTriceps] = useState('');
  const [dSubescapular, setDSubescapular] = useState('');
  const [dAbdominal, setDAbdominal] = useState('');
  const [dSuprailiaca, setDSuprailiaca] = useState('');
  const [dCoxa, setDCoxa] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const preview = useMemo(() => {
    const pesoN = campoNum(peso);
    const estaturaN = campoNum(estatura);
    const idadeN = parseInt(idade, 10);
    if (!pesoN || !estaturaN || !idadeN) return null;
    return calcularAvaliacao({
      peso: pesoN,
      estatura: estaturaN > 3 ? estaturaN / 100 : estaturaN,
      idade: idadeN,
      sexo,
      dobraPeitoral: campoNum(dPeitoral),
      dobraAxilar: campoNum(dAxilar),
      dobraTriceps: campoNum(dTriceps),
      dobraSubescapular: campoNum(dSubescapular),
      dobraAbdominal: campoNum(dAbdominal),
      dobraSuprailiaca: campoNum(dSuprailiaca),
      dobraCoxa: campoNum(dCoxa),
    });
  }, [peso, estatura, idade, sexo, dPeitoral, dAxilar, dTriceps, dSubescapular, dAbdominal, dSuprailiaca, dCoxa]);

  if (!modalAvaliacaoForm || !aluno) return null;

  const salvar = () => {
    const pesoN = campoNum(peso);
    const estaturaBruta = campoNum(estatura);
    const idadeN = parseInt(idade, 10);
    if (!pesoN || !estaturaBruta || !idadeN) return;
    const payload: AvaliacaoFormPayload = {
      data,
      peso: pesoN,
      estatura: estaturaBruta > 3 ? estaturaBruta / 100 : estaturaBruta,
      idade: idadeN,
      sexo,
      dobraPeitoral: campoNum(dPeitoral),
      dobraAxilar: campoNum(dAxilar),
      dobraTriceps: campoNum(dTriceps),
      dobraSubescapular: campoNum(dSubescapular),
      dobraAbdominal: campoNum(dAbdominal),
      dobraSuprailiaca: campoNum(dSuprailiaca),
      dobraCoxa: campoNum(dCoxa),
      observacoes,
    };
    salvarAvaliacao(payload);
  };

  const dobraField = (label: string, v: string, set: (v: string) => void) => (
    <div className="field" style={{ flex: 1, minWidth: 100 }}>
      <label>{label}</label>
      <input className="input" value={v} onChange={(e) => set(e.target.value)} placeholder="mm" />
    </div>
  );

  return (
    <div className="dialog-backdrop" style={{ zIndex: 85 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)', width: 'min(480px, 100%)', maxHeight: '88vh', overflow: 'auto' }}>
        <div className="dialog-title">Nova avaliação — {aluno.nome}</div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Data</label>
            <input className="input" value={data} onChange={(e) => setData(e.target.value)} placeholder="dd/mm/aaaa" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Sexo</label>
            <div className="seg" style={{ display: 'flex' }}>
              <label className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
                <input type="radio" name="sexo" checked={sexo === 'F'} onChange={() => setSexo('F')} /><span>F</span>
              </label>
              <label className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
                <input type="radio" name="sexo" checked={sexo === 'M'} onChange={() => setSexo('M')} /><span>M</span>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Peso (kg)</label>
            <input className="input" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="70" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Estatura (m)</label>
            <input className="input" value={estatura} onChange={(e) => setEstatura(e.target.value)} placeholder="1,70" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Idade</label>
            <input className="input" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="30" />
          </div>
        </div>

        <div className="card-kicker" style={{ marginTop: 4 }}>Dobras cutâneas (mm) — opcional, protocolo de 7 dobras</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {dobraField('Peitoral', dPeitoral, setDPeitoral)}
          {dobraField('Axilar média', dAxilar, setDAxilar)}
          {dobraField('Tríceps', dTriceps, setDTriceps)}
          {dobraField('Subescapular', dSubescapular, setDSubescapular)}
          {dobraField('Abdominal', dAbdominal, setDAbdominal)}
          {dobraField('Suprailíaca', dSuprailiaca, setDSuprailiaca)}
          {dobraField('Coxa', dCoxa, setDCoxa)}
        </div>

        <div className="field">
          <label>Observações</label>
          <textarea className="input" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        {preview && (
          <div className="card" style={{ gap: 6 }}>
            <div className="card-kicker">Prévia</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>IMC</span><span style={{ fontFamily: 'var(--font-heading)' }}>{preview.imc.toFixed(1)} · {preview.imcClasse}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Risco à saúde</span><span style={{ fontFamily: 'var(--font-heading)' }}>{preview.risco}</span>
            </div>
            {preview.temDobras && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>% de gordura</span><span style={{ fontFamily: 'var(--font-heading)' }}>{preview.percentualGordura!.toFixed(1)}%</span>
              </div>
            )}
            {!preview.temDobras && (
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>Preenche as 7 dobras pra calcular % de gordura também.</div>
            )}
          </div>
        )}

        {!preview && (
          <div style={{ fontSize: 11, color: 'var(--color-accent-700)' }}>Preenche peso, estatura e idade pra liberar o salvar.</div>
        )}
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={salvar} disabled={!preview}>Salvar avaliação</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
