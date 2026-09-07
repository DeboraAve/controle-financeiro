import type { ReactNode } from 'react';
import { Button } from './Button';

/** Estado vazio padrão — ícone + título + texto + CTA opcional. Hoje uma
 * lista vazia não tem tratamento nenhum; isso fecha essa lacuna. */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-8) var(--space-4)',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ color: 'var(--text-disabled)' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
        {title}
      </div>
      {description && <div style={{ fontSize: 'var(--text-sm)', maxWidth: 280 }}>{description}</div>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} style={{ marginTop: 'var(--space-2)' }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
