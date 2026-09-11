import { useEffect, useState } from 'react';
import { useApp } from '../../state/AppContext';
import type { TreinoPayload } from '../../lib/db';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { IconeExpandir } from '../ui/icons';

interface ItemDraft {
  chave: string;
  exercicioId: string;
  series: string;
  repeticoes: string;
  carga: string;
  descanso: string;
  observacoes: string;
}

interface DiaDraft {
  chave: string;
  nome: string;
  itens: ItemDraft[];
}

const novaChave = () => Math.random().toString(36).slice(2);
const novoItem = (exercicioId: string): ItemDraft => ({ chave: novaChave(), exercicioId, series: '', repeticoes: '', carga: '', descanso: '', observacoes: '' });
const novoDia = (): DiaDraft => ({ chave: novaChave(), nome: '', itens: [] });

export function TreinoFormModal() {
  const { modalTreinoForm, aluno, exerciciosOptions, salvarNovoTreino, abrirExercicios, fecharModal, mesAtualNome, editandoTreino } = useApp();
  const [nome, setNome] = useState('');
  const [dias, setDias] = useState<DiaDraft[]>([novoDia()]);
  // Sanfona — só o(s) dia(s) nesse conjunto aparece(m) aberto. Um treino
  // com vários dias × vários exercícios cada é a tela mais comprida do
  // app; abrir só um dia por vez evita ter que rolar por tudo pra achar
  // o campo que falta preencher.
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!modalTreinoForm) return;
    if (editandoTreino) {
      const diasPrefill: DiaDraft[] = editandoTreino.dias.length
        ? editandoTreino.dias.map((d) => ({
            chave: novaChave(),
            nome: d.nome,
            itens: d.itens.map((it) => ({
              chave: novaChave(),
              exercicioId: it.exercicioId,
              series: it.series != null ? String(it.series) : '',
              repeticoes: it.repeticoes,
              carga: it.carga != null ? String(it.carga).replace('.', ',') : '',
              descanso: it.descanso,
              observacoes: it.observacoes,
            })),
          }))
        : [novoDia()];
      setNome(editandoTreino.nome === 'Treino' ? '' : editandoTreino.nome);
      setDias(diasPrefill);
      setExpandidos(new Set([diasPrefill[0].chave]));
    } else {
      const primeiroDia = novoDia();
      setNome('');
      setDias([primeiroDia]);
      setExpandidos(new Set([primeiroDia.chave]));
    }
  }, [modalTreinoForm, editandoTreino]);

  const primeiroExercicio = exerciciosOptions[0]?.id ?? '';

  const toggleExpandido = (chave: string) =>
    setExpandidos((s) => {
      const next = new Set(s);
      if (next.has(chave)) next.delete(chave);
      else next.add(chave);
      return next;
    });

  const addDia = () => {
    const novo = novoDia();
    setDias((s) => [...s, novo]);
    setExpandidos((s) => new Set(s).add(novo.chave));
  };
  const removerDia = (chave: string) => setDias((s) => s.filter((d) => d.chave !== chave));
  const setDiaNome = (chave: string, v: string) => setDias((s) => s.map((d) => (d.chave === chave ? { ...d, nome: v } : d)));

  const addItem = (diaChave: string) => setDias((s) => s.map((d) => (d.chave === diaChave ? { ...d, itens: [...d.itens, novoItem(primeiroExercicio)] } : d)));
  const removerItem = (diaChave: string, itemChave: string) =>
    setDias((s) => s.map((d) => (d.chave === diaChave ? { ...d, itens: d.itens.filter((it) => it.chave !== itemChave) } : d)));
  const setItem = (diaChave: string, itemChave: string, patch: Partial<ItemDraft>) =>
    setDias((s) => s.map((d) => (d.chave === diaChave ? { ...d, itens: d.itens.map((it) => (it.chave === itemChave ? { ...it, ...patch } : it)) } : d)));

  const salvar = () => {
    const payload: TreinoPayload = {
      nome,
      dias: dias
        .filter((d) => d.itens.length > 0)
        .map((d) => ({
          nome: d.nome,
          itens: d.itens
            .filter((it) => it.exercicioId)
            .map((it) => ({
              exercicioId: it.exercicioId,
              series: it.series ? parseInt(it.series, 10) : null,
              repeticoes: it.repeticoes,
              carga: it.carga ? parseFloat(it.carga.replace(',', '.')) : null,
              descanso: it.descanso,
              observacoes: it.observacoes,
            })),
        })),
    };
    salvarNovoTreino(payload);
  };

  return (
    <Modal
      open={modalTreinoForm}
      onClose={fecharModal}
      title={`${editandoTreino ? 'Editar treino' : 'Montar treino'} — ${aluno?.nome ?? ''}`}
      actions={
        <>
          <Button variant="secondary" onClick={fecharModal}>Cancelar</Button>
          <Button variant="primary" onClick={salvar}>{editandoTreino ? 'Salvar alterações' : 'Salvar treino'}</Button>
        </>
      }
    >
      {exerciciosOptions.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>
          Sua biblioteca de exercícios está vazia.{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); abrirExercicios(); }}>Cadastra um exercício primeiro</a>, depois volta aqui pra montar o treino.
        </div>
      ) : (
        <>
          <div className="field">
            <label>Nome do treino</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={`Ex.: Treino de ${mesAtualNome}`} />
          </div>

          {dias.map((d, di) => {
            const aberto = expandidos.has(d.chave);
            return (
              <div key={d.chave} className="card" style={{ gap: 8 }}>
                <div
                  onClick={() => toggleExpandido(d.chave)}
                  style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14 }}>Dia {di + 1}{d.nome ? ' — ' + d.nome : ''}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{d.itens.length} exercício{d.itens.length === 1 ? '' : 's'}</div>
                  </div>
                  <IconeExpandir size={18} style={{ transform: aberto ? 'rotate(180deg)' : undefined, transition: 'transform var(--dur-fast) var(--ease-out)', flex: 'none' }} aria-hidden />
                </div>

                {aberto && (
                  <>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
                      <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Nome do dia</label>
                        <input className="input" value={d.nome} onChange={(e) => setDiaNome(d.chave, e.target.value)} placeholder="Ex.: Peito/Tríceps" />
                      </div>
                      {dias.length > 1 && <Button variant="secondary" onClick={() => removerDia(d.chave)}>Remover dia</Button>}
                    </div>

                    {d.itens.map((it) => (
                      <div key={it.chave} style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--color-divider)', paddingTop: 8 }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
                          <div className="field" style={{ flex: 1 }}>
                            <label>Exercício</label>
                            <select className="input" value={it.exercicioId} onChange={(e) => setItem(d.chave, it.chave, { exercicioId: e.target.value })}>
                              {exerciciosOptions.map((ex) => <option key={ex.id} value={ex.id}>{ex.nome}</option>)}
                            </select>
                          </div>
                          <Button variant="secondary" onClick={() => removerItem(d.chave, it.chave)}>Remover</Button>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <div className="field" style={{ flex: 1 }}>
                            <label>Séries</label>
                            <input className="input" value={it.series} onChange={(e) => setItem(d.chave, it.chave, { series: e.target.value.replace(/[^\d]/g, '') })} placeholder="3" />
                          </div>
                          <div className="field" style={{ flex: 1 }}>
                            <label>Repetições</label>
                            <input className="input" value={it.repeticoes} onChange={(e) => setItem(d.chave, it.chave, { repeticoes: e.target.value })} placeholder="8-12" />
                          </div>
                          <div className="field" style={{ flex: 1 }}>
                            <label>Carga (kg)</label>
                            <input className="input" value={it.carga} onChange={(e) => setItem(d.chave, it.chave, { carga: e.target.value.replace(/[^\d,.]/g, '') })} placeholder="20" />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <div className="field" style={{ flex: 1 }}>
                            <label>Descanso</label>
                            <input className="input" value={it.descanso} onChange={(e) => setItem(d.chave, it.chave, { descanso: e.target.value })} placeholder="60s" />
                          </div>
                          <div className="field" style={{ flex: 2 }}>
                            <label>Observação</label>
                            <input className="input" value={it.observacoes} onChange={(e) => setItem(d.chave, it.chave, { observacoes: e.target.value })} placeholder="opcional" />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button variant="secondary" onClick={() => addItem(d.chave)}>+ Exercício</Button>
                  </>
                )}
              </div>
            );
          })}

          <Button variant="secondary" block onClick={addDia}>+ Dia de treino</Button>
        </>
      )}
    </Modal>
  );
}
