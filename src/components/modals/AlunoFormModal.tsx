import { useEffect, useState } from 'react';
import { useApp, type AlunoFormPayload } from '../../state/AppContext';
import { diaVencimentoDe } from '../../lib/calc';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { StepDots } from '../ui/StepDots';
import { IconeCarregando } from '../ui/icons';

const hoje = new Date().toISOString().slice(0, 10);

const PLANO_TIPOS = ['Pacote', 'Valor por aula'] as const;
const DIAS_SEMANA = [
  { v: 0, l: 'D' }, { v: 1, l: 'S' }, { v: 2, l: 'T' }, { v: 3, l: 'Q' }, { v: 4, l: 'Q' }, { v: 5, l: 'S' }, { v: 6, l: 'S' },
];
const NOMES_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

// Cadastro antigo pode ter "Mensalidade fixa" salvo (opção removida — nunca
// teve comportamento diferente de Pacote, só o texto) — trata como Pacote.
function planoTipoDe(plano: string): (typeof PLANO_TIPOS)[number] {
  return plano === 'Valor por aula' ? 'Valor por aula' : 'Pacote';
}

export function AlunoFormModal() {
  const { modalAlunoForm, editandoAluno, academiasOptions, salvarAluno, fecharModal } = useApp();

  const [nome, setNome] = useState('');
  const [academiaId, setAcademiaId] = useState<string>('');
  const [planoTipo, setPlanoTipo] = useState<(typeof PLANO_TIPOS)[number]>('Pacote');
  const [valorPacote, setValorPacote] = useState('');
  const [valorAula, setValorAula] = useState('');
  const [aulasPrevistas, setAulasPrevistas] = useState('8');
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 3]);
  const [horariosPorDia, setHorariosPorDia] = useState<Record<number, string>>({});
  const [horario, setHorario] = useState('');
  const [fone, setFone] = useState('');
  const [desde, setDesde] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [passo, setPasso] = useState(0);

  // Passo "Dias da semana" só existe pra cadastro novo de pacote — editar
  // não mexe nos dias, e valor por aula não tem dias fixos.
  const etapaDias = !editandoAluno && planoTipo === 'Pacote';
  const totalPassos = etapaDias ? 3 : 2;

  useEffect(() => {
    // Se o tipo de cobrança mudou e o passo "dias" sumiu, não deixa o
    // usuário preso num passo que não existe mais.
    setPasso((p) => Math.min(p, totalPassos - 1));
  }, [totalPassos]);

  useEffect(() => {
    if (!modalAlunoForm) return;
    setSalvando(false);
    setPasso(0);
    if (editandoAluno) {
      setNome(editandoAluno.nome);
      setAcademiaId(editandoAluno.academiaId != null ? String(editandoAluno.academiaId) : '');
      setPlanoTipo(planoTipoDe(editandoAluno.plano));
      setValorPacote(String(editandoAluno.base));
      setValorAula(editandoAluno.valorAula != null ? String(editandoAluno.valorAula) : '');
      setAulasPrevistas(String(editandoAluno.previstas));
      setHorario(editandoAluno.horario);
      setFone(editandoAluno.fone);
      setDesde(editandoAluno.desde);
    } else {
      setNome('');
      setAcademiaId('');
      setPlanoTipo('Pacote');
      setValorPacote('');
      setValorAula('');
      setAulasPrevistas('8');
      setDiasSemana([1, 3]);
      setHorariosPorDia({});
      setHorario('');
      setFone('');
      setDesde('');
    }
  }, [modalAlunoForm, editandoAluno]);

  const toggleDia = (v: number) => {
    setDiasSemana((s) => (s.includes(v) ? s.filter((d) => d !== v) : [...s, v]));
  };

  const desdeEhAntigo = !!editandoAluno && desde !== '' && diaVencimentoDe(desde) === null;

  const diasOrdenados = [...diasSemana].sort((a, b) => a - b);
  const previaTexto = editandoAluno
    ? ''
    : diasOrdenados.length
      ? diasOrdenados.map((d) => NOMES_SEMANA[d] + (horariosPorDia[d]?.trim() ? ' ' + horariosPorDia[d].trim() : '')).join(' · ')
      : 'Marca os dias da semana das aulas';

  const setHorarioDoDia = (d: number, v: string) => setHorariosPorDia((s) => ({ ...s, [d]: v }));

  const salvar = () => {
    const payload: AlunoFormPayload = {
      nome,
      academiaId: academiaId || null,
      planoTipo,
      valorPacote: parseInt(valorPacote || '0', 10),
      valorAula: parseInt(valorAula || '0', 10),
      diasSemana,
      aulasPrevistas: Math.max(1, parseInt(aulasPrevistas || '1', 10)),
      horariosPorDia,
      horario,
      fone,
      desde,
    };
    setSalvando(true);
    salvarAluno(payload).finally(() => setSalvando(false));
  };

  const ultimoPasso = passo === totalPassos - 1;

  return (
    <Modal
      open={modalAlunoForm}
      onClose={fecharModal}
      title={editandoAluno ? 'Editar aluno' : 'Novo aluno'}
      actions={
        <>
          <Button variant="secondary" onClick={passo === 0 ? fecharModal : () => setPasso((p) => p - 1)} disabled={salvando}>
            {passo === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          {ultimoPasso ? (
            <Button variant="primary" onClick={salvar} disabled={salvando}>
              {salvando ? <IconeCarregando size={16} className="spin" aria-hidden /> : editandoAluno ? 'Salvar' : 'Cadastrar'}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setPasso((p) => p + 1)} disabled={passo === 0 && !nome.trim()}>Continuar</Button>
          )}
        </>
      }
    >
      <StepDots total={totalPassos} atual={passo} />

      {passo === 0 && (
        <>
          <div className="field">
            <label>Nome</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Marina Duarte" />
          </div>

          <div className="field">
            <label>Academia</label>
            <select className="input" value={academiaId} onChange={(e) => setAcademiaId(e.target.value)}>
              <option value="">Sem academia / estúdio próprio</option>
              {academiasOptions.map((ac) => (
                <option key={ac.id} value={ac.id}>{ac.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Telefone</label>
              <input className="input" value={fone} onChange={(e) => setFone(e.target.value)} placeholder="(11) 9 0000-0000" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Aluno desde</label>
              <input className="input" type="date" value={desde} max={hoje} onChange={(e) => setDesde(e.target.value)} />
            </div>
          </div>
          {desdeEhAntigo && (
            <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
              Cadastro antigo, sem dia definido ({desde || 'em branco'}) — escolhe uma data pra esse aluno ganhar vencimento próprio, em vez do dia genérico da configuração geral.
            </div>
          )}
        </>
      )}

      {passo === 1 && (
        <>
          {!editandoAluno && (
            <div className="field">
              <label>Tipo de cobrança</label>
              <div className="seg" style={{ display: 'flex' }}>
                {PLANO_TIPOS.map((t) => (
                  <label key={t} className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
                    <input type="radio" name="planoTipo" checked={planoTipo === t} onChange={() => setPlanoTipo(t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
              {planoTipo === 'Valor por aula' && (
                <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 4 }}>
                  Sem pacote fixo — o aluno começa o mês sem nenhuma aula, e você confirma cada aula dada pelo detalhe dele. O total do mês é a contagem × o valor por aula.
                </div>
              )}
            </div>
          )}

          {planoTipo === 'Valor por aula' ? (
            <div className="field">
              <label>Valor por aula (R$)</label>
              <input className="input" value={valorAula} onChange={(e) => setValorAula(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
            </div>
          ) : editandoAluno ? (
            <>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Valor do pacote (R$)</label>
                  <input className="input" value={valorPacote} onChange={(e) => setValorPacote(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Nº de aulas previstas</label>
                  <input className="input" value={aulasPrevistas} onChange={(e) => setAulasPrevistas(e.target.value.replace(/[^\d]/g, ''))} placeholder="8" />
                </div>
              </div>
              <div className="field">
                <label>Horário</label>
                <input className="input" value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Ex.: Ter · Qui 07h" />
              </div>
            </>
          ) : (
            <div className="field">
              <label>Valor do pacote (R$)</label>
              <input className="input" value={valorPacote} onChange={(e) => setValorPacote(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
            </div>
          )}
        </>
      )}

      {passo === 2 && etapaDias && (
        <>
          <div className="field">
            <label>Dias da semana das aulas</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d.v}
                  onClick={() => toggleDia(d.v)}
                  className={'tag ' + (diasSemana.includes(d.v) ? 'tag-accent' : 'tag-outline')}
                  style={{ cursor: 'pointer', flex: 1, justifyContent: 'center', fontFamily: 'var(--font-heading)' }}
                >
                  {d.l}
                </div>
              ))}
            </div>
          </div>
          {diasOrdenados.length > 0 && (
            <div className="field">
              <label>Horário de cada dia (opcional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {diasOrdenados.map((d) => (
                  <div key={d} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <div style={{ width: 40, fontSize: 12, color: 'var(--color-neutral-700)', fontFamily: 'var(--font-heading)' }}>{NOMES_SEMANA[d]}</div>
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      value={horariosPorDia[d] ?? ''}
                      onChange={(e) => setHorarioDoDia(d, e.target.value)}
                      placeholder="Ex.: 07h"
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 4 }}>Pode deixar horários diferentes por dia, ou repetir o mesmo em todos.</div>
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{previaTexto}</div>
        </>
      )}
    </Modal>
  );
}
