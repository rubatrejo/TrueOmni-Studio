/**
 * Wireframe 1 — "Grid + Clock + Weather".
 *
 * Header con clock+weather arriba + grid izquierdo de 4 cards
 * + card grande derecha (TOUCH TO START) + footer plano.
 */
export function Wireframe1() {
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
      {/* Header (clock + weather) */}
      <rect x={4} y={4} width={82} height={22} rx={1.5} />
      <line x1={45} y1={4} x2={45} y2={26} />
      {/* Grid izquierdo: 4 cards */}
      <rect x={4} y={30} width={40} height={32} rx={1} />
      <rect x={4} y={64} width={40} height={32} rx={1} />
      <rect x={4} y={98} width={40} height={16} rx={1} />
      <rect x={4} y={116} width={40} height={16} rx={1} />
      {/* Card grande derecha */}
      <rect x={46} y={30} width={40} height={102} rx={1} />
      {/* Footer */}
      <rect x={1} y={140} width={88} height={19} />
    </svg>
  );
}
