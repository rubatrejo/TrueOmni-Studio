'use client';

/**
 * Iconos de los 3 tipos de task del Scavenger Hunt. Verbatim del diseño XD:
 * contenedor = CUADRADO REDONDEADO (rx≈22%), glifo blanco centrado.
 * Colores = brand tokens aprobados (cascadean con el branding del cliente):
 * - Photo:    cuadrado azul oscuro (--brand-primary)  + cámara blanca
 * - Check-in: cuadrado azul medio  (--brand-secondary) + pin de ubicación blanco
 * - Question: cuadrado olive        (--brand-tertiary)  + ? blanco
 */

interface TaskTypeIconProps {
  type: 'checkin' | 'photo' | 'question';
  size?: number;
}

export function TaskTypeIcon({ type, size = 40 }: TaskTypeIconProps) {
  // Radio de esquina ~22% del lado (squircle del diseño).
  const rx = 9;

  switch (type) {
    case 'photo':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="0" y="0" width="40" height="40" rx={rx} fill="hsl(var(--brand-primary))" />
          <path d="M16.5 14l1.3-2.5h4.4L23.5 14" fill="white" />
          <rect x="10" y="14" width="20" height="13" rx="2.5" fill="white" />
          <circle
            cx="20"
            cy="20.5"
            r="4"
            fill="hsl(var(--brand-primary))"
            stroke="white"
            strokeWidth="0"
          />
          <circle cx="20" cy="20.5" r="2.4" fill="white" />
          <circle cx="20" cy="20.5" r="4" fill="none" stroke="hsl(var(--brand-primary))" />
        </svg>
      );
    case 'question':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="0" y="0" width="40" height="40" rx={rx} fill="hsl(var(--brand-tertiary))" />
          <text
            x="20"
            y="28"
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
          <rect x="0" y="0" width="40" height="40" rx={rx} fill="hsl(var(--brand-secondary))" />
          {/* Pin de ubicación blanco con hueco central */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20 10c-3.6 0-6.5 2.9-6.5 6.5 0 4.6 6.5 12 6.5 12s6.5-7.4 6.5-12C26.5 12.9 23.6 10 20 10zm0 9a2.6 2.6 0 110-5.2 2.6 2.6 0 010 5.2z"
            fill="white"
          />
        </svg>
      );
    default:
      return null;
  }
}
