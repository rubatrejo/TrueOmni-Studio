/**
 * Wireframe 0 — "Dark Hero".
 *
 * Hero full-bleed + logo centrado arriba + botón TOUCH HERE central
 * + footer split diagonal (Back_Tab + Front_Tab del SVG original).
 *
 * Cero rellenos, solo strokes mono-color para indicar divisiones.
 */
export function Wireframe0() {
  return (
    <svg
      viewBox="0 0 90 160"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full text-zinc-400 dark:text-zinc-600"
      stroke="currentColor"
      fill="none"
      strokeWidth={0.8}
      aria-hidden
    >
      <rect x={1} y={1} width={88} height={158} rx={2} />
      {/* Logo zone */}
      <rect x={20} y={26} width={50} height={9} rx={1} />
      {/* TOUCH HERE button */}
      <rect x={26} y={62} width={38} height={28} rx={2} />
      {/* Language pill */}
      <rect x={36} y={120} width={18} height={6} rx={3} />
      {/* Footer split diagonal — dos triángulos divididos por línea oblicua */}
      <line x1={1} y1={147} x2={89} y2={140} />
      <line x1={1} y1={140} x2={89} y2={147} />
      <line x1={1} y1={140} x2={1} y2={159} />
      <line x1={89} y1={140} x2={89} y2={159} />
      <line x1={1} y1={159} x2={89} y2={159} />
    </svg>
  );
}
