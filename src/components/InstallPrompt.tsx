import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { IconeCompartilhar, IconeFechar, IconeInstalar } from './ui/icons';

const CHAVE_DISPENSADO = 'impulsa-install-dispensado';

interface EventoInstalarPWA extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function jaInstalado() {
  // iOS não tem display-mode:standalone consistente em todo mundo, mas tem
  // navigator.standalone — os dois juntos cobrem Android/desktop e iOS.
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function ehIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

/** Instalar como app é o que separa "site que abro toda vez pelo link" de
 * "aplicativo de verdade" — depender só do prompt nativo do navegador (que
 * some depois de um tempo se ninguém interage) deixa isso invisível. Banner
 * próprio, dispensável, nunca aparece se já estiver instalado. */
export function InstallPrompt() {
  const [deferido, setDeferido] = useState<EventoInstalarPWA | null>(null);
  const [mostrarIOS, setMostrarIOS] = useState(false);
  const [dispensado, setDispensado] = useState(false);

  useEffect(() => {
    if (jaInstalado()) return;
    try {
      if (localStorage.getItem(CHAVE_DISPENSADO)) return;
    } catch {
      // sem localStorage — segue sem lembrar a dispensa entre sessões
    }

    if (ehIOS()) {
      setMostrarIOS(true);
      return;
    }

    const aoFicarInstalavel = (e: Event) => {
      e.preventDefault();
      setDeferido(e as EventoInstalarPWA);
    };
    const aoInstalar = () => setDeferido(null);
    window.addEventListener('beforeinstallprompt', aoFicarInstalavel);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoFicarInstalavel);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  const dispensar = () => {
    setDispensado(true);
    try {
      localStorage.setItem(CHAVE_DISPENSADO, '1');
    } catch {
      // idem — só não persiste entre sessões, sem quebrar nada
    }
  };

  const instalar = async () => {
    if (!deferido) return;
    await deferido.prompt();
    await deferido.userChoice;
    setDeferido(null);
  };

  // Sem conexão já tem o próprio aviso (OfflineBanner) — empilhar os dois
  // não ajuda, e instalar o app não é o problema de quem está offline agora.
  if (dispensado || !navigator.onLine || (!deferido && !mostrarIOS)) return null;

  return (
    <div className="install-banner">
      {deferido ? (
        <>
          <IconeInstalar size={20} aria-hidden />
          <span>Instala o Impulsa no aparelho pra abrir direto, sem navegador.</span>
          <Button variant="primary" onClick={instalar}>Instalar</Button>
        </>
      ) : (
        <>
          <IconeCompartilhar size={20} aria-hidden />
          <span>
            Pra instalar: toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
          </span>
        </>
      )}
      <button className="btn btn-ghost btn-icon" onClick={dispensar} aria-label="Dispensar">
        <IconeFechar size={16} aria-hidden />
      </button>
    </div>
  );
}
