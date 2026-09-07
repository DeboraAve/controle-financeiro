import { useApp } from '../state/AppContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Field';
import { ListRow } from '../components/ui/ListRow';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { Stack } from '../components/ui/Stack';
import { IconeAlunos, TAMANHO_ICONE } from '../components/ui/icons';

export function Alunos() {
  const { filtros, listaAlunos, busca, setBusca, contagem, abrirNovoAluno, abrirAcademias, recarregar } = useApp();

  return (
    <PullToRefresh onRefresh={recarregar}>
    <Stack gap={3}>
      <Stack direction="row" justify="space-between" align="baseline">
        <h2 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>Alunos</h2>
        <Button variant="ghost" style={{ padding: 0 }} onClick={abrirAcademias}>
          Academias
        </Button>
      </Stack>
      <Button variant="primary" block style={{ marginTop: 0 }} onClick={abrirNovoAluno}>
        + Novo aluno
      </Button>
      <Input type="text" placeholder="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        {filtros.map((f) => (
          <label key={f.rotulo} className="seg-opt">
            <input type="radio" name="filtro" checked={f.on} onChange={f.set} />
            <span>{f.rotulo}</span>
          </label>
        ))}
      </div>
      {listaAlunos.length === 0 ? (
        <EmptyState
          icon={<IconeAlunos size={TAMANHO_ICONE.xl} aria-hidden />}
          title="Nenhum aluno por aqui"
          description="Cadastre o primeiro aluno para começar a acompanhar pacotes, agenda e cobrança."
          actionLabel="Cadastrar primeiro aluno"
          onAction={abrirNovoAluno}
        />
      ) : (
        <div className="aluno-list">
          {listaAlunos.map((a) => (
            <ListRow
              key={a.id}
              onClick={a.abrir}
              avatarText={a.inicial}
              avatarTone={a.avatarTone}
              title={a.nome}
              badge={<Badge tone={a.tagTone}>{a.tagTexto}</Badge>}
              subtitle={a.sub}
              trailing={a.totalFmt}
              trailingSub={a.pagTexto}
              trailingSubTone={a.pagTone}
            />
          ))}
        </div>
      )}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{contagem}</div>
    </Stack>
    </PullToRefresh>
  );
}
