/**
 * Wireframe 3 — "2 cards arriba + banner central + 2 cards abajo".
 *
 * Fila 1 (2 cards) + banner central con TOUCH TO START + fila 2
 * (2 cards) + footer.
 */
export function Wireframe3() {
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
      {/* Fila 1 */}
      <rect x={1} y={1} width={44} height={38} />
      <rect x={45} y={1} width={44} height={38} />
      {/* Banner central */}
      <rect x={1} y={39} width={88} height={64} />
      {/* Logo + CTA dentro del banner */}
      <rect x={31} y={56} width={28} height={8} rx={1} />
      <rect x={20} y={80} width={36} height={6} rx={1} />
      <circle cx={62} cy={83} r={3.5} />
      {/* Fila 2 */}
      <rect x={1} y={103} width={44} height={37} />
      <rect x={45} y={103} width={44} height={37} />
      {/* Footer */}
      <rect x={1} y={140} width={88} height={19} />
    </svg>
  );
}
