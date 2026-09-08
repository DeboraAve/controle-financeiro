import { useEffect, useState } from 'react';
import { IconeSemConexao } from './ui/icons';

/** O app depende 100% do Supabase online — sem isso, uma ação que falha
 * silenciosamente (já reverte sozinha, ver patchAlunoOtimista) fica
 * parecendo bug. Uma faixa fixa deixa claro que é falta de conexão, não
 * o app quebrado, e some sozinha quando a rede volta. */
export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const marcarOnline = () => setOnline(true);
    const marcarOffline = () => setOnline(false);
    window.addEventListener('online', marcarOnline);
    window.addEventListener('offline', marcarOffline);
    return () => {
      window.removeEventListener('online', marcarOnline);
      window.removeEventListener('offline', marcarOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offline-banner">
      <IconeSemConexao size={16} aria-hidden />
      <span>Sem conexão — alguns dados podem estar desatualizados.</span>
    </div>
  );
}
