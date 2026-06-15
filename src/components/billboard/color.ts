/**
 * Convierte un color hex (#RGB, #RRGGBB o #RRGGBBAA) a `rgba()` con la opacidad
 * dada. Si el hex trae su propio alpha, se ignora en favor del `alpha` explícito
 * (el botón del idle separa color y opacidad como controles distintos).
 */
export function hexToRgba(hex: string, alpha: number): string {
  let h = (hex || '').replace('#', '').trim();
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length === 8) h = h.slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(0, 0, 0, ${a})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
