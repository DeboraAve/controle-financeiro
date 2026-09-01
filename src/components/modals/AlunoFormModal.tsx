import { useEffect, useState } from 'react';
import { useApp, type AlunoFormPayload } from '../../state/AppContext';
import { BlueprintCard } from '../BlueprintCard';

const PLANO_TIPOS = ['Pacote', 'Mensalidade fixa'] as const;
const DIAS_SEMANA = [
  { v: 0, l: 'D' }, { v: 1, l: 'S' }, { v: 2, l: 'T' }, { v: 3, l: 'Q' }, { v: 4, l: 'Q' }, { v: 5, l: 'S' }, { v: 6, l: 'S' },
];
const NOMES_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function planoTipoDe(plano: string): (typeof PLANO_TIPOS)[number] {
  return plano.startsWith('Pacote') ? 'Pacote' : 'Mensalidade fixa';
}

export function AlunoFormModal() {
  const { modalAlunoForm, editandoAluno, academiasOptions, salvarAluno, fecharModal } = useApp();

  const [nome, setNome] = useState('');
  const [academiaId, setAcademiaId] = useState<string>('');
  const [planoTipo, setPlanoTipo] = useState<(typeof PLANO_TIPOS)[number]>('Pacote');
  const [valorPacote, setValorPacote] = useState('');
  const [aulasPrevistas, setAulasPrevistas] = useState('8');
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 3]);
  const [horaTexto, setHoraTexto] = useState('');
  const [horario, setHorario] = useState('');
  const [fone, setFone] = useState('');
  const [desde, setDesde] = useState('');

  useEffect(() => {
    if (!modalAlunoForm) return;
    if (editandoAluno) {
      setNome(editandoAluno.nome);
      setAcademiaId(editandoAluno.academiaId != null ? String(editandoAluno.academiaId) : '');
      setPlanoTipo(planoTipoDe(editandoAluno.plano));
      setValorPacote(String(editandoAluno.base));
      setAulasPrevistas(String(editandoAluno.previstas));
      setHorario(editandoAluno.horario);
      setFone(editandoAluno.fone);
      setDesde(editandoAluno.desde);
    } else {
      setNome('');
      setAcademiaId('');
      setPlanoTipo('Pacote');
      setValorPacote('');
      setAulasPrevistas('8');
      setDiasSemana([1, 3]);
      setHoraTexto('');
      setHorario('');
      setFone('');
      setDesde('');
    }
  }, [modalAlunoForm, editandoAluno]);

  if (!modalAlunoForm) return null;

  const toggleDia = (v: number) => {
    setDiasSemana((s) => (s.includes(v) ? s.filter((d) => d !== v) : [...s, v]));
  };

  const previaTexto = editandoAluno
    ? ''
    : diasSemana.length
      ? [...diasSemana].sort((a, b) => a - b).map((d) => NOMES_SEMANA[d]).join('/') + (horaTexto.trim() ? ' · ' + horaTexto.trim() : '')
      : 'Marca os dias da semana das aulas';

  const salvar = () => {
    const payload: AlunoFormPayload = {
      nome,
      academiaId: academiaId || null,
      planoTipo,
      valorPacote: parseInt(valorPacote || '0', 10),
      diasSemana,
      aulasPrevistas: Math.max(1, parseInt(aulasPrevistas || '1', 10)),
      horaTexto,
      horario,
      fone,
      desde,
    };
    salvarAluno(payload);
  };

  return (
    <div className="dialog-backdrop" style={{ zIndex: 85 }}>
      <BlueprintCard className="dialog" style={{ background: 'var(--color-bg)' }}>
        <div className="dialog-title">{editandoAluno ? 'Editar aluno' : 'Novo aluno'}</div>

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
        </div>

        {editandoAluno ? (
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
          <>
            <div className="field">
              <label>Valor do pacote (R$)</label>
              <input className="input" value={valorPacote} onChange={(e) => setValorPacote(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
            </div>
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
            <div className="field">
              <label>Horário (opcional)</label>
              <input className="input" value={horaTexto} onChange={(e) => setHoraTexto(e.target.value)} placeholder="Ex.: 07h" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{previaTexto}</div>
          </>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Telefone</label>
            <input className="input" value={fone} onChange={(e) => setFone(e.target.value)} placeholder="(11) 9 0000-0000" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Aluno desde</label>
            <input className="input" value={desde} onChange={(e) => setDesde(e.target.value)} placeholder="Ex.: mar/24" />
          </div>
        </div>

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
          <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={salvar}>{editandoAluno ? 'Salvar' : 'Cadastrar'}</button>
        </div>
      </BlueprintCard>
    </div>
  );
}
