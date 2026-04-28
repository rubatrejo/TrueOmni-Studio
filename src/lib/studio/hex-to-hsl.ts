/**
 * Convierte un color HEX (`#RRGGBB`) al formato HSL que el sistema de
 * tokens del kiosk consume: `H S% L%` (sin función `hsl()`).
 *
 * Tailwind del proyecto resuelve los colores como `hsl(var(--token))`,
 * por lo que las CSS vars almacenan la triple separada por espacios.
 *
 * @example hexToHsl("#0088CE") // → "201 100% 40%"
 */
export function hexToHsl(hex: string): string {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return '0 0% 0%';

  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let H = 0;
  let S = 0;
  if (max !== min) {
    const d = max - min;
    S = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        H = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        H = (b - r) / d + 2;
        break;
      case b:
        H = (r - g) / d + 4;
        break;
    }
    H /= 6;
  }

  return `${Math.round(H * 360)} ${Math.round(S * 100)}% ${Math.round(l * 100)}%`;
}
