/* Tudo que só existe depois do login — carregado sob demanda (ver o
 * lazy() em App.tsx) pra quem ainda está na tela de Auth não baixar
 * nenhum byte disso. As telas em si também são lazy aqui dentro: só a
 * que a pessoa está vendo de fato entra no bundle carregado.
 *
 * Os modais ficam de fora dessa segunda divisão — eles precisam
 * continuar montados durante a própria animação de saída (Fase 2), então
 * já ficam sempre presentes na árvore; dividir o código deles não
 * economizaria nada, só atrasaria a primeira abertura de cada um. */
import { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { SideNav, TabBar } from './components/Nav';
import { Toast } from './components/Toast';
import { FeriasModal } from './components/modals/FeriasModal';
import { InativarModal } from './components/modals/InativarModal';
import { CobrancaModal } from './components/modals/CobrancaModal';
import { AjustesModal } from './components/modals/AjustesModal';
import { AlunoFormModal } from './components/modals/AlunoFormModal';
import { AlunoExcluirModal } from './components/modals/AlunoExcluirModal';
import { AcademiasModal } from './components/modals/AcademiasModal';
import { AcademiaFormModal } from './components/modals/AcademiaFormModal';
import { DespesaFormModal } from './components/modals/DespesaFormModal';
import { AvaliacaoFormModal } from './components/modals/AvaliacaoFormModal';
import { AvaliacaoDetalheModal } from './components/modals/AvaliacaoDetalheModal';
import { FecharMesModal } from './components/modals/FecharMesModal';
import { SkeletonCard, SkeletonRow } from './components/ui/Skeleton';
import { IconeAlunos, TAMANHO_ICONE } from './components/ui/icons';

const Painel = lazy(() => import('./screens/Painel').then((m) => ({ default: m.Painel })));
const Alunos = lazy(() => import('./screens/Alunos').then((m) => ({ default: m.Alunos })));
const AlunoDetalhe = lazy(() => import('./screens/AlunoDetalhe').then((m) => ({ default: m.AlunoDetalhe })));
const Agenda = lazy(() => import('./screens/Agenda').then((m) => ({ default: m.Agenda })));
const Caixa = lazy(() => import('./screens/Caixa').then((m) => ({ default: m.Caixa })));
const Cobranca = lazy(() => import('./screens/Cobranca').then((m) => ({ default: m.Cobranca })));
const GestaoPersonais = lazy(() => import('./screens/GestaoPersonais').then((m) => ({ default: m.GestaoPersonais })));

/** No mobile, lista e detalhe são duas telas cheias que se substituem
 * (`data-ativo` decide qual aparece). No desktop (≥900px) as duas
 * convivem lado a lado, estilo Mail/Notion — ver `.master-detail` em
 * app.css, que sobrescreve o display:none da regra de mobile. */
function AlunosMasterDetail() {
  const { isDetalhe } = useApp();
  return (
    <div className="master-detail" data-ativo={isDetalhe ? 'detalhe' : 'lista'}>
      <div className="master-list">
        <Alunos />
      </div>
      <div className="master-pane">
        {isDetalhe ? (
          <AlunoDetalhe />
        ) : (
          <div className="master-vazio">
            <IconeAlunos size={TAMANHO_ICONE.xl} aria-hidden />
            <span>Selecione um aluno na lista pra ver o detalhe.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Screen() {
  const { isGestao, isPainel, isAlunos, isDetalhe, isAgenda, isCaixa, isCobranca } = useApp();
  if (isGestao) return <GestaoPersonais />;
  if (isPainel) return <Painel />;
  if (isAlunos || isDetalhe) return <AlunosMasterDetail />;
  if (isAgenda) return <Agenda />;
  if (isCaixa) return <Caixa />;
  if (isCobranca) return <Cobranca />;
  return null;
}

function TelaCarregando() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <SkeletonCard />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}

function ViewingBanner() {
  const { viewingComo, voltarGestao } = useApp();
  if (!viewingComo) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-accent-100)', color: 'var(--color-accent-900)', padding: '8px 14px', fontSize: 12, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
      <span>Vendo a conta de <strong>{viewingComo}</strong></span>
      <button className="btn btn-ghost" style={{ padding: 0, fontSize: 12 }} onClick={voltarGestao}>← voltar à gestão</button>
    </div>
  );
}

function Shell() {
  const { loading, isGestao, isAlunos, isDetalhe } = useApp();
  if (loading) return <TelaCarregando />;
  return (
    <div className="app-shell">
      {!isGestao && <SideNav />}
      <div className="app-main">
        <main className={'app-content' + (isAlunos || isDetalhe ? ' is-wide' : '')}>
          <ViewingBanner />
          <Suspense fallback={<TelaCarregando />}>
            <Screen />
          </Suspense>
        </main>
        {!isGestao && <TabBar />}
      </div>
      <Toast />
      <FeriasModal />
      <InativarModal />
      <CobrancaModal />
      <AjustesModal />
      <AlunoFormModal />
      <AlunoExcluirModal />
      <AcademiasModal />
      <AcademiaFormModal />
      <DespesaFormModal />
      <AvaliacaoFormModal />
      <AvaliacaoDetalheModal />
      <FecharMesModal />
    </div>
  );
}

export default function AuthenticatedApp() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
