import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './state/AuthContext';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineBanner } from './components/OfflineBanner';
import { SkeletonCard, SkeletonRow } from './components/ui/Skeleton';
import { Auth } from './screens/Auth';

/* Tudo que só existe depois do login (AppContext, as telas, os 11
 * modais) vira um chunk à parte — quem está na tela de Auth não baixa
 * nenhum byte disso (achado da Fase 6: ~72% do bundle principal não
 * era usado no primeiro carregamento, ver docs/design/qa.md). */
const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'));

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

function Gate() {
  const { session, loading } = useAuth();
  if (loading) return <Carregando />;
  if (!session) return <Auth />;
  return (
    <Suspense fallback={<Carregando />}>
      <AuthenticatedApp />
    </Suspense>
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
