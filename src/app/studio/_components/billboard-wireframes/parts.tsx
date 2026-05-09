/**
 * Primitivas compartidas por los 4 wireframes del Idle Layout.
 *
 * Convenciones:
 *  - viewBox 90×160 (proporción 9:16 idéntica al kiosk en retrato).
 *  - Stroke fino en `text-zinc-400 dark:text-zinc-600` sobre fondo
 *    `bg-zinc-50 dark:bg-zinc-950/40` que pinta el contenedor padre.
 *  - Fills sutiles `text-zinc-200/40 dark:text-zinc-800/40` para
 *    diferenciar zonas "imagen" de zonas "control".
 *  - Iconos placeholder (montaña + sol) y logos abstractos para que el
 *    wireframe se lea de un vistazo sin parecer un boceto crudo.
 */

/** Caja con fill sutil. Indica "aquí va un slot de contenido". */
export function SlotBox({
  x,
  y,
  width,
  height,
  rx = 1,
  withImage = false,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  /** Pinta un placeholder de imagen (montaña + sol) centrado. */
  withImage?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        className="fill-zinc-100 stroke-current dark:fill-zinc-800/40"
      />
      {withImage && (
        <ImagePlaceholder cx={x + width / 2} cy={y + height / 2} size={Math.min(width, height)} />
      )}
    </g>
  );
}

/** Caja "decorativa" (header/footer). Fill más fuerte, sin imagen placeholder. */
export function PanelBox({
  x,
  y,
  width,
  height,
  rx = 0,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      className="fill-zinc-200/60 stroke-current dark:fill-zinc-800/70"
    />
  );
}

/** Pill genérico para CTAs / labels. */
export function Pill({
  x,
  y,
  width,
  height = 6,
  rx = 3,
  filled = false,
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
  rx?: number;
  filled?: boolean;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      className={
        filled
          ? 'fill-zinc-300 stroke-current dark:fill-zinc-700'
          : 'fill-transparent stroke-current'
      }
    />
  );
}

/** Logo placeholder abstracto: dos rectángulos juntos que evocan un wordmark. */
export function LogoPlaceholder({
  x,
  y,
  width,
  height = 7,
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
}) {
  const gap = 1;
  const seg = (width - gap * 2) / 3;
  return (
    <g>
      <rect x={x} y={y} width={seg} height={height} rx={1} className="fill-current" />
      <rect
        x={x + seg + gap}
        y={y}
        width={seg * 1.4}
        height={height}
        rx={1}
        className="fill-current opacity-60"
      />
      <rect
        x={x + seg + gap + seg * 1.4 + gap}
        y={y}
        width={seg * 0.6}
        height={height}
        rx={1}
        className="fill-current opacity-30"
      />
    </g>
  );
}

/** Placeholder universal de imagen: marco + montaña + sol. */
export function ImagePlaceholder({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  // Iconografía pequeña y centrada — escala con `size`.
  const s = Math.max(8, size * 0.32);
  const left = cx - s / 2;
  const top = cy - s / 2;
  return (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={0.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.55}
    >
      {/* Sol */}
      <circle cx={left + s * 0.3} cy={top + s * 0.32} r={s * 0.1} />
      {/* Montañas */}
      <path
        d={`M ${left} ${top + s * 0.78} L ${left + s * 0.35} ${top + s * 0.42} L ${left + s * 0.55} ${top + s * 0.62} L ${left + s * 0.78} ${top + s * 0.32} L ${left + s} ${top + s * 0.78} Z`}
      />
    </g>
  );
}

/** Reloj minimalista (dos rayas tipo dígitos). Para B1 header. */
export function ClockGlyph({
  x,
  y,
  width = 16,
  height = 5,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}) {
  return (
    <g className="fill-current opacity-70">
      <rect x={x} y={y} width={width * 0.42} height={height} rx={0.5} />
      <rect x={x + width * 0.5} y={y} width={width * 0.42} height={height} rx={0.5} />
    </g>
  );
}

/** Glyph de weather: sol + nube minimalistas. */
export function WeatherGlyph({ cx, cy, size = 8 }: { cx: number; cy: number; size?: number }) {
  return (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={0.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.7}
    >
      <circle cx={cx - size * 0.15} cy={cy - size * 0.1} r={size * 0.18} />
      <path
        d={`M ${cx - size * 0.3} ${cy + size * 0.25}
            a ${size * 0.18} ${size * 0.18} 0 0 1 ${size * 0.18} -${size * 0.18}
            a ${size * 0.22} ${size * 0.22} 0 0 1 ${size * 0.42} 0
            a ${size * 0.16} ${size * 0.16} 0 0 1 ${size * 0.05} ${size * 0.32}
            Z`}
      />
    </g>
  );
}
