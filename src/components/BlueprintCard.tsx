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
    <div className={`card blueprint ${className}`.trim()} style={style}>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      {children}
    </div>
  );
}
