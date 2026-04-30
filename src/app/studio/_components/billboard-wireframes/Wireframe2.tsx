/**
 * Wireframe 2 — "Hero + carousel 3-up".
 *
 * Hero full-bleed + logo arriba + carousel con card central grande
 * y peeks laterales más chicas + TOUCH TO START + footer.
 */
export function Wireframe2() {
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
      {/* Logo zone arriba centro */}
      <rect x={29} y={14} width={32} height={8} rx={1} />
      {/* Carousel: 3 cards (peek-left, central, peek-right) */}
      <rect x={2} y={48} width={18} height={56} rx={1} />
      <rect x={22} y={36} width={46} height={80} rx={1.5} />
      <rect x={70} y={48} width={18} height={56} rx={1} />
      {/* TOUCH TO START + arrow */}
      <rect x={20} y={124} width={42} height={7} rx={1} />
      <circle cx={66} cy={127.5} r={4} />
      {/* Footer */}
      <rect x={1} y={140} width={88} height={19} />
    </svg>
  );
}
