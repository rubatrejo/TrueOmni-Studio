import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';

/**
 * Líneas blancas sutiles entre celdas del canvas total. Simulan los
 * marcos físicos de los TVs en el preview del editor para que el
 * operador entienda dónde caen los splits.
 *
 * En runtime (cuando `?cell=row,col` está set), las líneas que caen
 * dentro del crop NO se ven (cada TV ve su porción limpia). Por eso
 * el componente siempre se renderea — el crop visual ya filtra.
 *
 * Pointer-events none: nunca intercepta interacción.
 */
export interface BezelOverlayProps {
  grid: GridConfig;
  /** Visibilidad. Útil para toggle on/off en el editor preview. */
  visible?: boolean;
}

export function BezelOverlay({ grid, visible = true }: BezelOverlayProps) {
  if (!visible) return null;
  const { cols, rows } = GRID_CONFIGS[grid];
  const width = cols * 1920;
  const height = rows * 1080;
  const verticalLines: number[] = [];
  for (let c = 1; c < cols; c += 1) verticalLines.push(c * 1920);
  const horizontalLines: number[] = [];
  for (let r = 1; r < rows; r += 1) horizontalLines.push(r * 1080);
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {verticalLines.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth={6}
        />
      ))}
      {horizontalLines.map((y) => (
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth={6}
        />
      ))}
    </svg>
  );
}
