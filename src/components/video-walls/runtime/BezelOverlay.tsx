import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';

/**
 * Separators entre celdas del canvas. Reproducción verbatim del grupo
 * `_3x2_Separators` del SVG Adobe XD:
 *   - stroke `#707070`
 *   - stroke-width 3
 *   - líneas horizontales en y = row*1080 (entre filas)
 *   - líneas verticales en x = col*1920 con `transform="translate(... 0.5)"`
 *
 * Suprimible con `?bezels=0` en la URL del runtime.
 */
export interface BezelOverlayProps {
  grid: GridConfig;
  visible?: boolean;
}

export function BezelOverlay({ grid, visible = true }: BezelOverlayProps) {
  if (!visible) return null;
  const { cols, rows } = GRID_CONFIGS[grid];
  const width = cols * 1920;
  const height = rows * 1080;
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ zIndex: 15 }}
    >
      {/* Horizontales (entre filas) */}
      {Array.from({ length: rows - 1 }).map((_, i) => {
        const y = (i + 1) * 1080;
        return (
          <line
            key={`h-${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            fill="none"
            stroke="#707070"
            strokeWidth="3"
          />
        );
      })}
      {/* Verticales (entre cols) — el XD usa translate(x 0.5) */}
      {Array.from({ length: cols - 1 }).map((_, i) => {
        const x = (i + 1) * 1920;
        return (
          <line
            key={`v-${x}`}
            x1={x}
            y1={0.5}
            x2={x}
            y2={height}
            fill="none"
            stroke="#707070"
            strokeWidth="3"
          />
        );
      })}
    </svg>
  );
}
