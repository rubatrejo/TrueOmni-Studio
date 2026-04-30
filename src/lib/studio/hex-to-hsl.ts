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

/**
 * Inverso de `hexToHsl`. Recibe un string `H S% L%` (formato del kiosk) y
 * devuelve un hex `#RRGGBB`. Útil para hidratar el Studio desde
 * `tokens.css` (cuyos tokens están en HSL) — el Studio gestiona los
 * brand colors como hex.
 *
 * @example hslToHex("201 100% 40%") // → "#0088CC"
 */
export function hslToHex(hsl: string): string {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%\s*$/.exec(hsl);
  if (!m) return '#000000';
  const h = ((Number(m[1]) % 360) + 360) % 360;
  const s = clamp01(Number(m[2]) / 100);
  const l = clamp01(Number(m[3]) / 100);

  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${toHex(v)}${toHex(v)}${toHex(v)}`;
  }

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  const offset = l - c / 2;
  const r = Math.round((r1 + offset) * 255);
  const g = Math.round((g1 + offset) * 255);
  const b = Math.round((b1 + offset) * 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0').toUpperCase();
}
