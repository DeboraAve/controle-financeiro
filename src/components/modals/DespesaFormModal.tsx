import { useEffect, useState } from 'react';
import { useApp, type DespesaFormPayload } from '../../state/AppContext';
import { BlueprintCard } from '../BlueprintCard';

export function DespesaFormModal() {
  const { modalDespesaForm, editandoDespesa, categorias, salvarDespesa, excluirDespesa, fecharModal } = useApp();

  const [dia, setDia] = useState('');
  const [cat, setCat] = useState('');
  const [desc, setDesc] = useState('');
  const [valor, setValor] = useState('');

  useEffect(() => {
    if (!modalDespesaForm || !editandoDespesa) return;
    setDia(editandoDespesa.dia);
    setCat(editandoDespesa.cat);
    setDesc(editandoDespesa.desc);
    setValor(String(editandoDespesa.valor));
  }, [modalDespesaForm, editandoDespesa]);

  if (!modalDespesaForm || !editandoDespesa) return null;

  const salvar = () => {
    const payload: DespesaFormPayload = { dia, cat, desc, valor: parseInt(valor || '0', 10) };
    salvarDespesa(payload);
  };

  return (
    <div className="dialog-backdrop" style={{ zIndex: 85 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)' }}>
        <div className="dialog-title">Editar despesa</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categorias.map((c) => (
            <div key={c.nome} onClick={() => setCat(c.nome)} className={'tag ' + (cat === c.nome ? 'tag-accent' : 'tag-outline')} style={{ cursor: 'pointer' }}>
              {c.nome}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="field" style={{ width: 130 }}>
            <label>Valor (R$)</label>
            <input className="input" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ''))} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Descrição</label>
            <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>

        <div className="field" style={{ width: 130 }}>
          <label>Dia (DD/MM)</label>
          <input className="input" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="28/09" />
        </div>

        <div className="dialog-actions" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={excluirDespesa}>Excluir</button>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
            <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={salvar}>Salvar</button>
          </div>
        </div>
      </BlueprintCard>
    </div>
  );
}
