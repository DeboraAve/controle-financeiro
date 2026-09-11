import { useEffect, useState } from 'react';
import { useApp } from '../../state/AppContext';
import type { ExercicioPayload } from '../../lib/db';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// Lista fechada em vez de texto livre — evita "Peito"/"Peitoral"/"peito"
// virando grupos diferentes só por causa de como cada um foi digitado.
export const GRUPOS_MUSCULARES = [
  'Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Antebraço',
  'Perna', 'Glúteo', 'Panturrilha', 'Abdômen', 'Cardio', 'Corpo inteiro',
];

export function ExercicioFormModal() {
  const { modalExercicioForm, editandoExercicio, salvarExercicio, fecharExercicioForm } = useApp();

  const [nome, setNome] = useState('');
  const [grupoMuscular, setGrupoMuscular] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!modalExercicioForm) return;
    if (editandoExercicio) {
      setNome(editandoExercicio.nome);
      setGrupoMuscular(editandoExercicio.grupoMuscular);
      setVideoUrl(editandoExercicio.videoUrl);
      setObservacoes(editandoExercicio.observacoes);
    } else {
      setNome('');
      setGrupoMuscular('');
      setVideoUrl('');
      setObservacoes('');
    }
  }, [modalExercicioForm, editandoExercicio]);

  const salvar = () => {
    const payload: ExercicioPayload = { nome, grupoMuscular, videoUrl, observacoes };
    salvarExercicio(payload);
  };

  return (
    <Modal
      open={modalExercicioForm}
      onClose={fecharExercicioForm}
      title={editandoExercicio ? 'Editar exercício' : 'Novo exercício'}
      actions={
        <>
          <Button variant="secondary" onClick={fecharExercicioForm}>Cancelar</Button>
          <Button variant="primary" onClick={salvar}>{editandoExercicio ? 'Salvar' : 'Cadastrar'}</Button>
        </>
      }
    >
      <div className="field">
        <label>Nome</label>
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Supino reto" />
      </div>
      <div className="field">
        <label>Grupo muscular</label>
        <select className="input" value={grupoMuscular} onChange={(e) => setGrupoMuscular(e.target.value)}>
          <option value="">Sem grupo definido</option>
          {/* Cadastro antigo pode ter um texto fora da lista — mantém como opção pra não trocar o valor sozinho ao abrir. */}
          {grupoMuscular && !GRUPOS_MUSCULARES.includes(grupoMuscular) && (
            <option value={grupoMuscular}>{grupoMuscular}</option>
          )}
          {GRUPOS_MUSCULARES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Link de vídeo (opcional)</label>
        <input className="input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="field">
        <label>Observação padrão (opcional)</label>
        <textarea className="input" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Ex.: cuidado com a lombar" />
      </div>
    </Modal>
  );
}
