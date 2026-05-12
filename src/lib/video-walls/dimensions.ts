/**
 * Dimensiones canónicas del producto Video Walls.
 *
 * Cada celda física = 1 TV landscape 1920×1080. El canvas total del wall
 * es `cols × 1920` × `rows × 1080`. Cada TV abre la URL del wall con
 * `?cell=row,col` y el runtime aplica un crop CSS para mostrar solo su
 * porción del canvas.
 *
 * Catálogo cerrado v1: 5 configuraciones fijas. Se amplía cuando el
 * cliente lo pida (sub-fase futura, no roadmap obligatorio).
 */

export const CELL = { w: 1920, h: 1080 } as const;

/**
 * Altura del header band continuo en la fila superior del wall.
 * Medida verbatim de los SVGs Adobe XD del catálogo 3×2 (Display_Info_Header
 * width=5760 height=335). El header del wall NO es el mismo del signage
 * landscape (155px) — es proporcionalmente más alto para que el contenido
 * sea legible desde lejos en grids grandes.
 */
export const HEADER_H = 335;

export const GRID_CONFIGS = {
  '3x2': { cols: 3, rows: 2 },
  '4x2': { cols: 4, rows: 2 },
  '2x2': { cols: 2, rows: 2 },
  '2x1': { cols: 2, rows: 1 },
  '1x2': { cols: 1, rows: 2 },
} as const;

export const GRID_CONFIG_IDS = ['3x2', '4x2', '2x2', '2x1', '1x2'] as const;
export type GridConfig = (typeof GRID_CONFIG_IDS)[number];

export interface CanvasDimensions {
  cols: number;
  rows: number;
  width: number;
  height: number;
}

export function canvasDimensionsOf(grid: GridConfig): CanvasDimensions {
  const { cols, rows } = GRID_CONFIGS[grid];
  return { cols, rows, width: cols * CELL.w, height: rows * CELL.h };
}

export interface CellRect {
  /** Fila top-left (0-based). */
  row: number;
  /** Columna top-left (0-based). */
  col: number;
  /** Filas que ocupa el slot. */
  rowSpan: number;
  /** Columnas que ocupa el slot. */
  colSpan: number;
}

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Resuelve un slot expresado en celdas a píxeles absolutos sobre el
 * canvas total del wall. Si el slot toca la fila 0, recorta los primeros
 * `HEADER_H` píxeles porque ahí pinta el header.
 */
export function cellRectToPx(rect: CellRect, includeHeaderTop = false): PixelRect {
  const x = rect.col * CELL.w;
  const fullY = rect.row * CELL.h;
  const fullH = rect.rowSpan * CELL.h;
  if (!includeHeaderTop && rect.row === 0) {
    return { x, y: fullY + HEADER_H, w: rect.colSpan * CELL.w, h: fullH - HEADER_H };
  }
  return { x, y: fullY, w: rect.colSpan * CELL.w, h: fullH };
}

/**
 * Parsea el query param `?cell=row,col`. Retorna `null` si está ausente,
 * inválido, o fuera de la grid del wall.
 */
export function parseCellParam(
  raw: string | string[] | undefined,
  grid: GridConfig,
): { row: number; col: number } | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return null;
  const m = /^(\d+),(\d+)$/.exec(s.trim());
  if (!m) return null;
  const row = Number.parseInt(m[1], 10);
  const col = Number.parseInt(m[2], 10);
  const { cols, rows } = GRID_CONFIGS[grid];
  if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
  return { row, col };
}
