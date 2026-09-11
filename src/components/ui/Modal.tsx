import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { IconeFechar } from './icons';

const LIMIAR_ARRASTAR_PX = 110;
const SELETOR_FOCAVEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal centralizado no desktop, bottom sheet arrastável no mobile —
 * mesmo componente, o breakpoint decide a apresentação (ver app.css,
 * `@media (max-width: 899px)`).
 *
 * O ciclo de vida é interno: ao contrário de um `if (!open) return null`
 * no chamador, aqui `open` vira `false` mas o componente continua montado
 * até a animação de saída terminar — senão não existe "saída" nenhuma,
 * só um corte seco. O chamador deve sempre renderizar `<Modal open={x}>`,
 * nunca condicionar o render do próprio componente a `x`.
 *
 * Fecha por: botão, clique no backdrop, Esc ou arrastar pra baixo (mobile) —
 * todos chamam `onClose`. O gesto de voltar do navegador/celular é tratado
 * fora daqui, num único lugar central (ver o efeito de histórico em
 * `AppContext`, que vigia só "existe modal aberto ou não" em vez de cada
 * modal ter sua própria entrada — evita a corrida entre pushState/back()
 * quando um modal-lista abre um modal-formulário por cima na mesma hora).
 */
export function Modal({
  open,
  onClose,
  title,
  danger = false,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  danger?: boolean;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<'entering' | 'exiting'>('entering');

  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const fechandoPorArrastoRef = useRef(false);
  const acionadoPorRef = useRef<HTMLElement | null>(null);
  const idTitulo = useId();

  // Ciclo de vida visual: `open` vira `false` mas o componente continua
  // montado até a animação de saída terminar (ver `aoTerminarSaida`).
  // O timer de segurança existe porque `animationend` pode nunca disparar
  // (aba em segundo plano, PWA minimizado, navegador que pausa animação) —
  // sem ele o modal fica "montado" pra sempre e trava a rolagem da página
  // de baixo mesmo depois de fechado, sem nenhum jeito de perceber por quê.
  useEffect(() => {
    if (open) {
      fechandoPorArrastoRef.current = false;
      setMounted(true);
      setPhase('entering');
      return;
    }
    if (mounted && !fechandoPorArrastoRef.current) {
      setPhase('exiting');
      const seguranca = setTimeout(() => setMounted(false), 600);
      return () => clearTimeout(seguranca);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Esc fecha e o scroll do body trava enquanto o modal existir — inclusive
  // durante a animação de saída, senão o fundo "pula" antes do sheet sumir.
  useEffect(() => {
    if (!mounted) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [mounted]);

  // Prende o Tab dentro do modal (sem isso, quem navega só por teclado
  // sai do modal e mexe em botão escondido atrás do backdrop — achado
  // testando de verdade, não só olhando o código) e devolve o foco pra
  // quem abriu o modal quando ele fecha.
  useEffect(() => {
    if (open) acionadoPorRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      acionadoPorRef.current?.focus?.();
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focaveis = () => Array.from(dialog.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL));
    (focaveis()[0] ?? dialog).focus();

    const aoTeclarTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const lista = focaveis();
      if (lista.length === 0) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', aoTeclarTab);
    return () => document.removeEventListener('keydown', aoTeclarTab);
  }, [mounted]);

  if (!mounted) return null;

  const aoTerminarSaida = () => {
    if (phase === 'exiting') setMounted(false);
  };

  const iniciarArrasto = (e: ReactPointerEvent<HTMLDivElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    dialog.style.transition = 'none';

    const mover = (ev: PointerEvent) => {
      const dy = Math.max(0, ev.clientY - startY);
      dialog.style.transform = `translateY(${dy}px)`;
    };

    const soltar = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      const dy = Math.max(0, ev.clientY - startY);

      if (dy > LIMIAR_ARRASTAR_PX) {
        fechandoPorArrastoRef.current = true;
        dialog.style.transition = 'transform var(--dur-fast) var(--ease-in)';
        dialog.style.transform = 'translateY(100%)';
        if (backdropRef.current) backdropRef.current.style.animation = 'none';
        if (backdropRef.current) backdropRef.current.style.opacity = '0';
        if (backdropRef.current) backdropRef.current.style.transition = 'opacity var(--dur-fast) var(--ease-in)';
        const aoFinalizar = () => {
          dialog.removeEventListener('transitionend', aoFinalizar);
          onCloseRef.current();
          setMounted(false);
        };
        dialog.addEventListener('transitionend', aoFinalizar);
      } else {
        dialog.style.transition = 'transform var(--dur-fast) var(--ease-out)';
        dialog.style.transform = 'translateY(0)';
        const aoVoltarLugar = () => {
          dialog.removeEventListener('transitionend', aoVoltarLugar);
          dialog.style.transition = '';
          dialog.style.transform = '';
        };
        dialog.addEventListener('transitionend', aoVoltarLugar);
      }
    };

    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
  };

  return (
    <div
      ref={backdropRef}
      className="dialog-backdrop"
      data-phase={phase}
      onClick={onClose}
      onAnimationEnd={(e) => e.target === e.currentTarget && aoTerminarSaida()}
    >
      <div
        ref={dialogRef}
        className="dialog"
        data-phase={phase}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        style={{
          background: 'var(--surface-raised)',
          border: danger ? '1.5px solid var(--status-danger)' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" onPointerDown={iniciarArrasto} aria-hidden />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div className="dialog-title" id={idTitulo}>{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
            <IconeFechar size={18} aria-hidden />
          </button>
        </div>
        {children}
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}
