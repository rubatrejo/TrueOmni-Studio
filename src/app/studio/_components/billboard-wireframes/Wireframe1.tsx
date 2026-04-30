import { ClockGlyph, LogoPlaceholder, PanelBox, Pill, SlotBox, WeatherGlyph } from './parts';

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
      className="h-full w-full text-zinc-400 dark:text-zinc-500"
      stroke="currentColor"
      fill="none"
      strokeWidth={0.6}
      aria-hidden
    >
      <rect x={1} y={1} width={88} height={158} rx={2} />

      {/* Header (clock + weather) — fill medio, dos zonas separadas */}
      <PanelBox x={4} y={4} width={82} height={22} rx={1.5} />
      {/* Clock zone */}
      <ClockGlyph x={9} y={12} width={18} height={6} />
      <Pill x={9} y={20} width={20} height={2} rx={1} filled />
      {/* Weather zone */}
      <WeatherGlyph cx={70} cy={13} size={10} />
      <Pill x={62} y={19} width={18} height={3} rx={1} filled />

      {/* Grid izquierdo: 4 cards */}
      <SlotBox x={4} y={30} width={40} height={32} rx={1} withImage />
      <SlotBox x={4} y={64} width={40} height={32} rx={1} withImage />
      <SlotBox x={4} y={98} width={40} height={16} rx={1} withImage />
      <SlotBox x={4} y={116} width={40} height={16} rx={1} withImage />

      {/* Card grande derecha (TOUCH TO START) */}
      <SlotBox x={46} y={30} width={40} height={102} rx={1} withImage />
      <Pill x={54} y={120} width={24} height={5} rx={1} filled />

      {/* Footer */}
      <PanelBox x={1} y={140} width={88} height={19} />
      <LogoPlaceholder x={6} y={148} width={24} height={4} />
    </svg>
  );
}
