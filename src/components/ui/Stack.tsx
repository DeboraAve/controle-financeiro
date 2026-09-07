import type { CSSProperties, ElementType, ReactNode } from 'react';

/** Espaçamento de flexbox por token — mata o
 * `style={{display:'flex',flexDirection:'column',gap:'var(--space-3)'}}`
 * que abre quase toda tela do app. */
export function Stack({
  as: As = 'div',
  direction = 'column',
  gap = 3,
  align,
  justify,
  wrap,
  children,
  className,
  style,
  onClick,
}: {
  as?: ElementType;
  direction?: 'row' | 'column';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <As
      className={className}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: gap === 0 ? 0 : `var(--space-${gap})`,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
    >
      {children}
    </As>
  );
}
