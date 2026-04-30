import { ImagePlaceholder, LogoPlaceholder, PanelBox, Pill, SlotBox } from './parts';

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
      className="h-full w-full text-zinc-400 dark:text-zinc-500"
      stroke="currentColor"
      fill="none"
      strokeWidth={0.6}
      aria-hidden
    >
      <rect x={1} y={1} width={88} height={158} rx={2} />

      {/* Hero fill — fondo tenue, montaña/sol pequeños arriba */}
      <rect
        x={1}
        y={1}
        width={88}
        height={138}
        rx={2}
        className="fill-zinc-100/60 stroke-none dark:fill-zinc-800/30"
      />
      <ImagePlaceholder cx={45} cy={26} size={32} />

      {/* Logo wordmark */}
      <LogoPlaceholder x={29} y={14} width={32} height={6} />

      {/* Carousel — peek izquierda más chica y retranqueada */}
      <SlotBox x={2} y={48} width={18} height={56} rx={1} withImage />
      {/* Card central grande con borde marcado */}
      <g>
        <rect
          x={22}
          y={36}
          width={46}
          height={80}
          rx={1.5}
          className="fill-white stroke-current dark:fill-zinc-900"
          strokeWidth={1}
        />
        <ImagePlaceholder cx={45} cy={68} size={32} />
        <Pill x={32} y={102} width={26} height={5} rx={1} filled />
      </g>
      {/* Peek derecha */}
      <SlotBox x={70} y={48} width={18} height={56} rx={1} withImage />

      {/* TOUCH TO START + arrow */}
      <Pill x={20} y={123} width={42} height={7} rx={1} />
      <circle
        cx={66}
        cy={126.5}
        r={4}
        className="fill-zinc-200 stroke-current dark:fill-zinc-800"
      />

      {/* Footer */}
      <PanelBox x={1} y={140} width={88} height={19} />
      <LogoPlaceholder x={6} y={148} width={24} height={4} />
    </svg>
  );
}
