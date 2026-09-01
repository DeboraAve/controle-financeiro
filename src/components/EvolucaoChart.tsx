interface Ponto {
  rotulo: string;
  valor: number;
  valorFmt: string;
}

export function EvolucaoChart({ titulo, pontos }: { titulo: string; pontos: Ponto[] }) {
  if (pontos.length < 2) return null;

  const w = 320;
  const h = 96;
  const padX = 28;
  const padTop = 22;
  const padBottom = 20;

  const valores = pontos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const span = max - min || 1;

  const x = (i: number) => padX + (i * (w - padX * 2)) / (pontos.length - 1);
  const y = (v: number) => padTop + (h - padTop - padBottom) * (1 - (v - min) / span);

  const linha = pontos.map((p, i) => x(i) + ',' + y(p.valor)).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="card-kicker">{titulo}</div>
      <svg viewBox={'0 0 ' + w + ' ' + h} style={{ width: '100%', height: h, display: 'block', overflow: 'visible' }}>
        <polyline points={linha} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pontos.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.valor)} r={4} fill="var(--color-accent)" />
            <text x={x(i)} y={y(p.valor) - 10} textAnchor="middle" fontSize={9} fill="var(--color-text)" fontFamily="var(--font-heading)">
              {p.valorFmt}
            </text>
            <text x={x(i)} y={h - 4} textAnchor="middle" fontSize={8} fill="var(--color-neutral-600)">
              {p.rotulo}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
