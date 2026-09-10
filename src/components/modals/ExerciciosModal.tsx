import { useApp } from '../../state/AppContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function ExerciciosModal() {
  const { modalExercicios, exerciciosResumo, abrirNovoExercicio, fecharModal } = useApp();
  return (
    <Modal
      open={modalExercicios}
      onClose={fecharModal}
      title="Biblioteca de exercícios"
      actions={<Button variant="primary" onClick={fecharModal}>Pronto</Button>}
    >
      <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>Cadastre aqui uma vez e reuse em quantos treinos quiser.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {exerciciosResumo.map((ex) => (
          <div key={ex.id} className="card" style={{ gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{ex.nome}</div>
              {ex.grupoMuscular && <span className="tag tag-outline">{ex.grupoMuscular}</span>}
            </div>
            {ex.videoUrl && (
              <a href={ex.videoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11 }} onClick={(e) => e.stopPropagation()}>
                ver vídeo de referência
              </a>
            )}
            {ex.observacoes && <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{ex.observacoes}</div>}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 2 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={ex.editar}>Editar</Button>
              <Button variant="secondary" onClick={ex.excluir}>Excluir</Button>
            </div>
          </div>
        ))}
        {exerciciosResumo.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Nenhum exercício cadastrado ainda.</div>
        )}
      </div>
      <Button variant="secondary" block onClick={abrirNovoExercicio}>+ Novo exercício</Button>
    </Modal>
  );
}
