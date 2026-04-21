/**
 * Iconos SVG del clima por código WMO. Todos con stroke del color pasado,
 * sin fill, escalables. Usados en el header y en el popup.
 */
export function WeatherIcon({
  code,
  size = 64,
  color = '#fff',
  strokeWidth = 2,
}: {
  code: number;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    role: 'img' as const,
    'aria-hidden': true,
  };

  // Sol (clear)
  if (code === 0) {
    return (
      <svg {...common}>
        <circle cx="24" cy="24" r="8" fill={color} stroke="none" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 24 + Math.cos(rad) * 14;
          const y1 = 24 + Math.sin(rad) * 14;
          const x2 = 24 + Math.cos(rad) * 20;
          const y2 = 24 + Math.sin(rad) * 20;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </svg>
    );
  }

  // Sol + nube (partly cloudy)
  if (code <= 2) {
    return (
      <svg {...common}>
        <circle cx="17" cy="18" r="6" fill={color} stroke="none" />
        {[-45, 0, 45, 90].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 17 + Math.cos(rad) * 10;
          const y1 = 18 + Math.sin(rad) * 10;
          const x2 = 17 + Math.cos(rad) * 14;
          const y2 = 18 + Math.sin(rad) * 14;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <path
          d="M18 30a6 6 0 0 1 12 0 5 5 0 0 1 6 5v1a5 5 0 0 1-5 5H18a6 6 0 0 1 0-12z"
          fill={color}
          stroke="none"
        />
      </svg>
    );
  }

  // Nube sólida (cloudy / default fallback)
  return (
    <svg {...common}>
      <path
        d="M12 30a8 8 0 0 1 16 0 6 6 0 0 1 0 12H12a6 6 0 0 1 0-12z"
        fill={color}
        stroke="none"
      />
    </svg>
  );
}
