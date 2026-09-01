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
import { Auth } from './screens/Auth';
import { Painel } from './screens/Painel';
import { Alunos } from './screens/Alunos';
import { AlunoDetalhe } from './screens/AlunoDetalhe';
import { Agenda } from './screens/Agenda';
import { Caixa } from './screens/Caixa';
import { Cobranca } from './screens/Cobranca';

function Screen() {
  const { isPainel, isAlunos, isDetalhe, isAgenda, isCaixa, isCobranca } = useApp();
  if (isPainel) return <Painel />;
  if (isDetalhe) return <AlunoDetalhe />;
  if (isAlunos) return <Alunos />;
  if (isAgenda) return <Agenda />;
  if (isCaixa) return <Caixa />;
  if (isCobranca) return <Cobranca />;
  return null;
}

function Carregando() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)', color: 'var(--color-neutral-600)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
      Carregando…
    </div>
  );
}

function Shell() {
  const { loading } = useApp();
  if (loading) return <Carregando />;
  return (
    <div className="app-shell">
      <SideNav />
      <div className="app-main">
        <div className="app-content">
          <Screen />
        </div>
        <TabBar />
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
