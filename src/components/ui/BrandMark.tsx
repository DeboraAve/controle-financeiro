/* O símbolo da Impulsa: uma linha de pulso que termina em seta de
 * crescimento. Geometria em src/brand/mark.svg — inline aqui (em vez de
 * <img>) para renderizar nítido em qualquer tamanho sem requisição extra. */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <linearGradient id="impulsa-mark-g" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF3D7F" />
          <stop offset="100%" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="58" fill="url(#impulsa-mark-g)" />
      <path
        d="M28 112 L64 112 L78 84 L94 132 L110 96 L124 112 L142 112 L162 62"
        fill="none"
        stroke="#FFF7F3"
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="170.2,41.6 172.7,66.3 151.3,57.7" fill="#FFF7F3" />
    </svg>
  );
}
