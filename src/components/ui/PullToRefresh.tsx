import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { IconeCarregando } from './icons';

const LIMIAR_PX = 64;
const RESISTENCIA = 0.5; // o indicador anda metade do que o dedo arrasta
const TETO_PX = 90;

/** Puxar pra baixo no topo da lista busca os dados de novo — só ativa
 * quando a página já está no topo (`window.scrollY === 0`), pra não
 * competir com o scroll normal. Pointer Events, sem lib de gestos, mesma
 * linha do drag-to-dismiss do Modal. */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<unknown>; children: ReactNode }) {
  const [puxado, setPuxado] = useState(0);
  const [emGesto, setEmGesto] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const arrastandoRef = useRef(false);
  const startYRef = useRef(0);

  const aoPressionar = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (atualizando || window.scrollY > 0) return;
    arrastandoRef.current = true;
    startYRef.current = e.clientY;
    setEmGesto(true);
  };

  const aoMover = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!arrastandoRef.current) return;
    const dy = e.clientY - startYRef.current;
    if (dy <= 0 || window.scrollY > 0) {
      arrastandoRef.current = false;
      setEmGesto(false);
      setPuxado(0);
      return;
    }
    setPuxado(Math.min(dy * RESISTENCIA, TETO_PX));
  };

  const aoSoltar = () => {
    if (!arrastandoRef.current) return;
    arrastandoRef.current = false;
    setEmGesto(false);
    // Lê `puxado` direto (não via updater funcional) — colocar o efeito
    // colateral de disparar `onRefresh` dentro de um updater é o clássico
    // jeito de fazer o StrictMode chamá-lo duas vezes sem querer.
    if (puxado > LIMIAR_PX * RESISTENCIA) {
      setAtualizando(true);
      setPuxado(LIMIAR_PX * RESISTENCIA);
      onRefresh().finally(() => {
        setAtualizando(false);
        setPuxado(0);
      });
    } else {
      setPuxado(0);
    }
  };

  const altura = atualizando ? LIMIAR_PX * RESISTENCIA : puxado;
  const pronto = puxado > LIMIAR_PX * RESISTENCIA;

  return (
    <div
      onPointerDown={aoPressionar}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
      style={{ userSelect: emGesto ? 'none' : undefined }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: altura,
          overflow: 'hidden',
          transition: emGesto ? 'none' : 'height var(--dur-fast) var(--ease-out)',
          color: 'var(--brand)',
        }}
      >
        <IconeCarregando
          size={20}
          className={atualizando ? 'spin' : undefined}
          style={{
            opacity: Math.min(altura / (LIMIAR_PX * RESISTENCIA), 1),
            transform: atualizando ? undefined : `rotate(${pronto ? 180 : puxado * 2.8}deg)`,
            transition: emGesto ? 'none' : 'transform var(--dur-fast) var(--ease-out)',
          }}
          aria-hidden
        />
      </div>
      {children}
    </div>
  );
}
