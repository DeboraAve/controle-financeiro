import { AppProvider, useApp } from './state/AppContext';
import { AuthProvider, useAuth } from './state/AuthContext';
import { SideNav, TabBar } from './components/Nav';
import { Toast } from './components/Toast';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineBanner } from './components/OfflineBanner';
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
import { SkeletonCard, SkeletonRow } from './components/ui/Skeleton';
import { IconeAlunos, TAMANHO_ICONE } from './components/ui/icons';
import { Auth } from './screens/Auth';
import { Painel } from './screens/Painel';
import { Alunos } from './screens/Alunos';
import { AlunoDetalhe } from './screens/AlunoDetalhe';
import { Agenda } from './screens/Agenda';
import { Caixa } from './screens/Caixa';
import { Cobranca } from './screens/Cobranca';
import { GestaoPersonais } from './screens/GestaoPersonais';

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

function Carregando() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <SkeletonCard />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

function Shell() {
  const { loading, isGestao, isAlunos, isDetalhe } = useApp();
  if (loading) return <Carregando />;
  return (
    <div className="app-shell">
      {!isGestao && <SideNav />}
      <div className="app-main">
        <main className={'app-content' + (isAlunos || isDetalhe ? ' is-wide' : '')}>
          <ViewingBanner />
          <Screen />
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
    </div>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  if (loading) return <Carregando />;
  if (!session) return <Auth />;
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineBanner />
      <Gate />
      <InstallPrompt />
    </AuthProvider>
  );
}
