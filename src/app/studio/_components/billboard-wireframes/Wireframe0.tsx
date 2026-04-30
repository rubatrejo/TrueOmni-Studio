import { ImagePlaceholder, LogoPlaceholder, Pill } from './parts';

/**
 * Wireframe 0 — "Dark Hero".
 *
 * Hero full-bleed (foto) + logo grande + botón TOUCH HERE central
 * + footer split diagonal (Back_Tab + Front_Tab del SVG original).
 */
export function Wireframe0() {
  return (
    <svg
      viewBox="0 0 90 160"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full text-zinc-400 dark:text-zinc-500"
      stroke="currentColor"
      fill="none"
      strokeWidth={0.6}
      aria-hidden
    >
      {/* Marco exterior */}
      <rect x={1} y={1} width={88} height={158} rx={2} />

      {/* Hero: fill suave en toda la zona superior + montaña/sol decorativos */}
      <rect
        x={1}
        y={1}
        width={88}
        height={138}
        rx={2}
        className="fill-zinc-100/70 stroke-none dark:fill-zinc-800/30"
      />
      <ImagePlaceholder cx={45} cy={20} size={28} />

      {/* Logo wordmark sobre el botón */}
      <LogoPlaceholder x={26} y={48} width={38} height={6} />

      {/* Botón TOUCH HERE central — contraste alto, fill blanco con borde marcado */}
      <g>
        <rect
          x={26}
          y={64}
          width={38}
          height={26}
          rx={2}
          className="fill-white stroke-current dark:fill-zinc-900"
          strokeWidth={1}
        />
        <Pill x={36} y={75} width={18} height={4} rx={2} filled />
      </g>

      {/* Language pill decorativo abajo del hero */}
      <Pill x={36} y={120} width={18} height={6} rx={3} />

      {/* Footer split diagonal — dos polígonos rellenos en tonos sutiles */}
      <g>
        {/* Back_Tab (trapezoide superior) */}
        <polygon
          points="1,140 89,133 89,159 1,159"
          className="fill-zinc-200/80 stroke-none dark:fill-zinc-800/70"
        />
        {/* Front_Tab (trapezoide inferior — fill más fuerte) */}
        <polygon
          points="1,147 89,140 89,159 1,159"
          className="fill-zinc-300 stroke-none dark:fill-zinc-700"
        />
        {/* Línea diagonal del split */}
        <line x1={1} y1={147} x2={89} y2={140} />
        {/* Marco del footer */}
        <rect x={1} y={140} width={88} height={19} className="fill-none" strokeWidth={0.4} />
        {/* Mini logo dentro del footer */}
        <LogoPlaceholder x={6} y={150} width={22} height={4} />
      </g>
    </svg>
  );
}
