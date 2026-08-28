import { useEffect, useState } from 'react';
import { useApp, type AcademiaFormPayload } from '../../state/AppContext';
import type { ModeloCobranca } from '../../data/model';
import { BlueprintCard } from '../BlueprintCard';

export function AcademiaFormModal() {
  const { modalAcademiaForm, editandoAcademia, academiaModelos, salvarAcademia, fecharAcademiaForm } = useApp();

  const [nome, setNome] = useState('');
  const [modelo, setModelo] = useState<ModeloCobranca>('mensal_fixo');
  const [valorCobrado, setValorCobrado] = useState('');
  const [custoPorTrecho, setCustoPorTrecho] = useState('');
  const [viagensPorSemana, setViagensPorSemana] = useState('');

  useEffect(() => {
    if (!modalAcademiaForm) return;
    if (editandoAcademia) {
      setNome(editandoAcademia.nome);
      setModelo(editandoAcademia.modelo);
      setValorCobrado(String(editandoAcademia.valorCobrado));
      setCustoPorTrecho(String(editandoAcademia.custoPorTrecho));
      setViagensPorSemana(String(editandoAcademia.viagensPorSemana));
    } else {
      setNome('');
      setModelo('mensal_fixo');
      setValorCobrado('');
      setCustoPorTrecho('');
      setViagensPorSemana('');
    }
  }, [modalAcademiaForm, editandoAcademia]);

  if (!modalAcademiaForm) return null;

  const salvar = () => {
    const payload: AcademiaFormPayload = {
      nome,
      modelo,
      valorCobrado: parseInt(valorCobrado || '0', 10),
      custoPorTrecho: parseInt(custoPorTrecho || '0', 10),
      viagensPorSemana: parseInt(viagensPorSemana || '0', 10),
    };
    salvarAcademia(payload);
  };

  return (
    <div className="dialog-backdrop" style={{ zIndex: 90 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)' }}>
        <div className="dialog-title">{editandoAcademia ? 'Editar academia' : 'Nova academia'}</div>

        <div className="field">
          <label>Nome</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Vigor" />
        </div>

        <div className="field">
          <label>Modelo de cobrança</label>
          <div className="seg" style={{ display: 'flex' }}>
            {academiaModelos.map((m) => (
              <label key={m.value} className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
                <input type="radio" name="modelo" checked={modelo === m.value} onChange={() => setModelo(m.value)} />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 4 }}>
            {modelo === 'mensal_fixo' ? 'Valor fixo por mês, não importa quantos alunos.' : 'Valor multiplicado pelo nº de alunos ativos nessa academia.'}
          </div>
        </div>

        <div className="field">
          <label>Valor cobrado (R${modelo === 'por_aluno' ? ' por aluno' : '/mês'})</label>
          <input className="input" value={valorCobrado} onChange={(e) => setValorCobrado(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Deslocamento por viagem (R$)</label>
            <input className="input" value={custoPorTrecho} onChange={(e) => setCustoPorTrecho(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Viagens por semana</label>
            <input className="input" value={viagensPorSemana} onChange={(e) => setViagensPorSemana(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
          Conte só as idas de verdade — se vê mais de um aluno na mesma ida, é 1 viagem só, não uma por aluno.
        </div>

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={fecharAcademiaForm}>Cancelar</button>
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={salvar}>{editandoAcademia ? 'Salvar' : 'Cadastrar'}</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
