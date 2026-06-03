'use client';

/**
 * Iconos SVG circulares para los 3 tipos de task del Scavenger Hunt.
 * Colores verbatim del diseño XD:
 * - Photo: círculo azul oscuro (brand-primary) con cámara blanca
 * - Question: círculo amarillo/olive (#c4a335) con ? blanco
 * - Check-in: círculo azul teal/claro (#2d8faa) con persona blanca
 */

interface TaskTypeIconProps {
  type: 'checkin' | 'photo' | 'question';
  size?: number;
}

export function TaskTypeIcon({ type, size = 40 }: TaskTypeIconProps) {
  switch (type) {
    case 'photo':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="hsl(var(--brand-primary))" />
          <rect x="11" y="16" width="18" height="12" rx="2" fill="white" />
          <circle
            cx="20"
            cy="22"
            r="3.5"
            stroke="hsl(var(--brand-primary))"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="20" cy="22" r="1.8" fill="hsl(var(--brand-primary))" />
          <path d="M16.5 16l1.2-2.5h4.6l1.2 2.5" fill="white" />
        </svg>
      );
    case 'question':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="#c4a335" />
          <text
            x="20"
            y="27"
            textAnchor="middle"
            fontSize="22"
            fontWeight="bold"
            fill="white"
            fontFamily="sans-serif"
          >
            ?
          </text>
        </svg>
      );
    case 'checkin':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="#2d8faa" />
          <circle cx="20" cy="14.5" r="4.5" fill="white" />
          <path d="M12 30c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="white" />
        </svg>
      );
    default:
      return null;
  }
}
