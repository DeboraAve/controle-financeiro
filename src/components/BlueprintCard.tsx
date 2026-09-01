import type { CSSProperties, ReactNode } from 'react';

export function BlueprintCard({
  children,
  style,
  className = '',
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={`card elev-sm ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
