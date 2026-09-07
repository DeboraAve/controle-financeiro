import { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext';
import { IconeAviso, IconeErro, IconeOk } from './ui/icons';
import type { Tone } from './ui/tone';

const ICONE_POR_TONE: Partial<Record<Tone, typeof IconeOk>> = {
  ok: IconeOk,
  danger: IconeErro,
  warning: IconeAviso,
};

/** Fica montado durante a saída (fade) — igual ao Modal, senão não existe
 * "saída" nenhuma, só o toast sumindo seco. Guarda a última mensagem à
 * parte porque `toast` já virou null quando a animação de saída começa. */
export function Toast() {
  const { toast } = useApp();
  const [mounted, setMounted] = useState(!!toast);
  const [phase, setPhase] = useState<'entering' | 'exiting'>('entering');
  const [ultimo, setUltimo] = useState(toast);

  useEffect(() => {
    if (toast) {
      setUltimo(toast);
      setMounted(true);
      setPhase('entering');
    } else if (mounted) {
      setPhase('exiting');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  if (!mounted || !ultimo) return null;

  const Icone = ICONE_POR_TONE[ultimo.tone];

  return (
    <div className="toast" data-phase={phase} onAnimationEnd={() => phase === 'exiting' && setMounted(false)}>
      {Icone && <Icone size={16} aria-hidden />}
      <span>{ultimo.msg}</span>
    </div>
  );
}
