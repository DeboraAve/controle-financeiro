import type { CSSProperties, ReactNode } from 'react';

/** Encapsula .card + .elev-* de industry.css. Substitui BlueprintCard nas
 * telas migradas; BlueprintCard segue existindo para as telas que ainda
 * não passaram por esta fase. */
export function Card({
  children,
  elevation = 'sm',
  className = '',
  style,
}: {
  children: ReactNode;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
}) {
  const classes = ['card', elevation !== 'none' && `elev-${elevation}`, className].filter(Boolean).join(' ');
  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
