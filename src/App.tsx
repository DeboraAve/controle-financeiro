import { AppProvider, useApp } from './state/AppContext';
import { SideNav, TabBar } from './components/Nav';
import { Toast } from './components/Toast';
import { FeriasModal } from './components/modals/FeriasModal';
import { InativarModal } from './components/modals/InativarModal';
import { CobrancaModal } from './components/modals/CobrancaModal';
import { AjustesModal } from './components/modals/AjustesModal';
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

function Shell() {
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
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
