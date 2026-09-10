import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { BlueprintCard } from '../components/BlueprintCard';
import { EvolucaoChart } from '../components/EvolucaoChart';
import { formatarDesde } from '../lib/calc';
import { CAMPOS_COMPARAVEIS } from '../lib/avaliacaoCalc';

export function AlunoDetalhe() {
  const { aluno, voltar, addExtra, limparAjustes, abrirFerias, abrirInativar, abrirEditarAluno, abrirExcluirAluno, avaliacoes, avaliacoesEvolucao, abrirNovaAvaliacao } = useApp();
  const [metricasVisiveis, setMetricasVisiveis] = useState<Set<string>>(() => new Set(['peso', 'percentualGordura']));
  if (!aluno) return null;

  // Cada campo comparável (peso, IMC, dobras, perimetria...) vira uma opção
  // de gráfico de evolução — só entra na lista quem tem pelo menos 2
  // avaliações preenchidas pra esse campo específico.
  const metricas = CAMPOS_COMPARAVEIS.map((c) => {
    const pontos = avaliacoesEvolucao
      .filter((av) => av.bruto[c.key] != null)
      .map((av) => {
        const v = av.bruto[c.key] as number;
        return { rotulo: av.data, valor: v, valorFmt: v.toFixed(1) + (c.unidade ? ' ' + c.unidade : '') };
      });
    return { key: c.key, label: c.label, pontos };
  }).filter((m) => m.pontos.length > 1);

  const toggleMetrica = (key: string) => {
    setMetricasVisiveis((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', paddingInline: 0 }} onClick={voltar}>← Alunos</button>
        <button className="btn btn-ghost" style={{ paddingInline: 0 }} onClick={() => abrirEditarAluno(aluno.id)}>Editar</button>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 29, margin: 0 }}>{aluno.nome}</h2>
          <span className={aluno.tagClass}>{aluno.tagTexto}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{aluno.sub} · aluno desde {formatarDesde(aluno.desde)}</div>
      </div>

      <BlueprintCard style={{ gap: 'var(--space-2)' }}>
        <div className="card-kicker">Fechamento de setembro</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{aluno.linhaBase}</span><span style={{ fontFamily: 'var(--font-heading)' }}>{aluno.baseFmt}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-neutral-700)' }}><span>{aluno.canceladasTxt}</span><span style={{ fontFamily: 'var(--font-heading)' }}>− {aluno.descCancelFmt}</span></div>
          {aluno.temFerias && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-neutral-700)' }}><span>Desconto de férias</span><span style={{ fontFamily: 'var(--font-heading)' }}>− {aluno.feriasFmt}</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-neutral-700)' }}><span>{aluno.extrasTxt}</span><span style={{ fontFamily: 'var(--font-heading)' }}>+ {aluno.extrasFmt}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--color-divider)', paddingTop: 8, marginTop: 2 }}>
            <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>Total do mês</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 30 }}>{aluno.totalFmt}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>Cada aula vale {aluno.valorAulaFmt} · {aluno.pagFrase}</div>
        </div>
      </BlueprintCard>

      {aluno.impactoPerderTexto && (
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
          {aluno.impactoPerderTexto}
        </div>
      )}

      <BlueprintCard style={{ gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="card-kicker">Aulas do mês</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>toque pra cancelar</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
          {aluno.sessoes.map((s) => (
            <div key={s.id} onClick={s.toggle} style={{ cursor: 'pointer', border: `1px solid ${s.borda}`, background: s.fundo, color: s.cor, padding: '7px 4px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14 }}>{s.dia}</div>
              <div style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.rotulo}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={addExtra}>+ Aula extra</button>
          <button className="btn btn-secondary" onClick={limparAjustes}>Zerar ajustes</button>
        </div>
      </BlueprintCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <button className="btn btn-primary btn-block" style={{ marginTop: 0 }} onClick={aluno.acaoPagamento}>{aluno.acaoPagamentoTexto}</button>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={abrirFerias}>{aluno.textoFerias}</button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={abrirInativar}>{aluno.textoInativo}</button>
        </div>
        <button className="btn btn-ghost" style={{ alignSelf: 'center', fontSize: 12 }} onClick={abrirExcluirAluno}>Excluir aluno de vez</button>
      </div>

      {metricas.length > 0 && (
        <BlueprintCard style={{ gap: 'var(--space-3)' }}>
          <div className="card-kicker" style={{ marginBottom: -4 }}>Evolução</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {metricas.map((m) => (
              <div
                key={m.key}
                onClick={() => toggleMetrica(m.key)}
                className={'tag ' + (metricasVisiveis.has(m.key) ? 'tag-accent' : 'tag-outline')}
                style={{ cursor: 'pointer' }}
              >
                {m.label}
              </div>
            ))}
          </div>
          {metricas.filter((m) => metricasVisiveis.has(m.key)).map((m) => (
            <EvolucaoChart key={m.key} titulo={m.label} pontos={m.pontos} />
          ))}
          {metricas.every((m) => !metricasVisiveis.has(m.key)) && (
            <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Escolhe pelo menos uma métrica ali em cima pra ver o gráfico.</div>
          )}
        </BlueprintCard>
      )}

      <BlueprintCard style={{ gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="card-kicker">Avaliação física</div>
          <button className="btn btn-ghost" style={{ padding: 0, fontSize: 12 }} onClick={abrirNovaAvaliacao}>+ Nova</button>
        </div>
        {avaliacoes.map((av) => (
          <div
            key={av.id}
            onClick={av.abrirDetalhe}
            style={{ display: 'flex', flexDirection: 'column', gap: 3, borderBottom: '1px solid color-mix(in srgb, var(--color-text) 7%, transparent)', paddingBottom: 8, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>{av.data}</span>
              <button className="btn btn-ghost" style={{ padding: 0, fontSize: 11 }} onClick={(e) => { e.stopPropagation(); av.excluir(); }}>excluir</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
              {av.pesoFmt} · IMC {av.imcFmt} ({av.imcClasse}) · {av.risco}
              {av.temDobras && <> · {av.percentualGorduraFmt} gordura · {av.massaMagraFmt} massa magra</>}
              {av.rcqFmt && <> · RCQ {av.rcqFmt}</>}
            </div>
            {av.observacoes && <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{av.observacoes}</div>}
          </div>
        ))}
        {avaliacoes.length === 0 && <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Nenhuma avaliação registrada ainda.</div>}
        {avaliacoes.length > 0 && <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>toque numa avaliação pra ver o detalhamento e enviar</div>}
      </BlueprintCard>

      <div className="card" style={{ gap: 'var(--space-2)' }}>
        <div className="card-kicker">Histórico</div>
        {aluno.historico.map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-neutral-700)', borderBottom: '1px solid color-mix(in srgb, var(--color-text) 7%, transparent)', paddingBottom: 5 }}>
            <span>{h.mes}</span><span>{h.nota}</span><span style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{h.valor}</span>
          </div>
        ))}
        {aluno.historico.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Nenhum mês fechado ainda — use "Fechar o mês" no Painel pra começar o histórico dele.</div>
        )}
        {aluno.historico.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
            {aluno.historico.length === 1 ? 'Média do último mês' : 'Média dos últimos ' + aluno.historico.length + ' meses'}: {aluno.media}
          </div>
        )}
      </div>
      <div style={{ height: 6 }} />
    </div>
  );
}
