import { AppProvider, useApp } from './state/AppContext';
import { AuthProvider, useAuth } from './state/AuthContext';
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
import { Auth } from './screens/Auth';
import { Painel } from './screens/Painel';
import { Alunos } from './screens/Alunos';
import { AlunoDetalhe } from './screens/AlunoDetalhe';
import { Agenda } from './screens/Agenda';
import { Caixa } from './screens/Caixa';
import { Cobranca } from './screens/Cobranca';
import { GestaoPersonais } from './screens/GestaoPersonais';

function Screen() {
  const { isGestao, isPainel, isAlunos, isDetalhe, isAgenda, isCaixa, isCobranca } = useApp();
  if (isGestao) return <GestaoPersonais />;
  if (isPainel) return <Painel />;
  if (isDetalhe) return <AlunoDetalhe />;
  if (isAlunos) return <Alunos />;
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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)', color: 'var(--color-neutral-600)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
      Carregando…
    </div>
  );
}

function Shell() {
  const { loading, isGestao } = useApp();
  if (loading) return <Carregando />;
  return (
    <div className="app-shell">
      {!isGestao && <SideNav />}
      <div className="app-main">
        <div className="app-content">
          <ViewingBanner />
          <Screen />
        </div>
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
      <Gate />
    </AuthProvider>
  );
}
