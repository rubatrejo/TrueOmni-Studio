import { ImagePlaceholder, LogoPlaceholder, PanelBox, Pill, SlotBox } from './parts';

/**
 * Wireframe 3 — "2 cards arriba + banner central + 2 cards abajo".
 */
export function Wireframe3() {
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
      <rect x={1} y={1} width={88} height={158} rx={2} />

      {/* Fila 1: 2 cards con imagen */}
      <SlotBox x={1} y={1} width={44} height={38} withImage />
      <SlotBox x={45} y={1} width={44} height={38} withImage />

      {/* Banner central (hero secundario) — fill diferenciado */}
      <rect
        x={1}
        y={39}
        width={88}
        height={64}
        className="fill-zinc-100/70 stroke-current dark:fill-zinc-800/40"
      />
      <ImagePlaceholder cx={45} cy={56} size={26} />
      {/* Logo + CTA dentro del banner */}
      <LogoPlaceholder x={31} y={74} width={28} height={5} />
      <Pill x={20} y={86} width={36} height={6} rx={1} filled />
      <circle
        cx={62}
        cy={89}
        r={3.5}
        className="fill-zinc-200 stroke-current dark:fill-zinc-800"
      />

      {/* Fila 2: 2 cards con imagen */}
      <SlotBox x={1} y={103} width={44} height={37} withImage />
      <SlotBox x={45} y={103} width={44} height={37} withImage />

      {/* Footer */}
      <PanelBox x={1} y={140} width={88} height={19} />
      <LogoPlaceholder x={6} y={148} width={24} height={4} />
    </svg>
  );
}
