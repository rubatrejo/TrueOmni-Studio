'use client';

/**
 * Botón de compartir reutilizable (mismo glyph que el detalle de listings y el
 * detalle de Passes). El color lo hereda del contenedor vía `currentColor`; el
 * tamaño es configurable. La acción concreta (Web Share / fallback) la decide el
 * consumidor — aquí solo va la UI.
 */
export function ShareIconButton({
  onShare,
  size = 20,
  className,
  ariaLabel = 'Share',
}: {
  onShare: () => void;
  size?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button type="button" aria-label={ariaLabel} onClick={onShare} className={className}>
      <svg
        width={size}
        height={(size * 81.25) / 72.914}
        viewBox="0 0 72.914 81.25"
        fill="currentColor"
        aria-hidden
      >
        <g transform="translate(-13.543 -9.375)">
          <path d="M70.832,9.375a15.625,15.625,0,1,1-11.52,26.18L43.9,44.8a15.61,15.61,0,0,1,0,10.395l15.41,9.246A15.607,15.607,0,1,1,56.094,69.8l-15.41-9.25a15.623,15.623,0,1,1,0-21.113l15.41-9.25A15.627,15.627,0,0,1,70.832,9.375Z" />
        </g>
      </svg>
    </button>
  );
}
