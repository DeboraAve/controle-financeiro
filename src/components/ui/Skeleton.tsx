/* Skeleton com shimmer — substitui o "Carregando…" genérico por uma
 * indicação estrutural do que vai aparecer. O shimmer usa `.skeleton` de
 * industry.css (adicionado ali, ao lado das outras classes de componente). */

export function SkeletonText({ width = '100%' }: { width?: number | string }) {
  return <div className="skeleton skeleton-text" style={{ width }} />;
}

export function SkeletonRow() {
  return (
    <div className="aluno-row" style={{ cursor: 'default' }}>
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', flex: 'none' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonText width="60%" />
        <SkeletonText width="35%" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card elev-sm" style={{ gap: 'var(--space-3)' }}>
      <SkeletonText width="40%" />
      <div className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />
    </div>
  );
}
