/**
 * Extracción simple de paleta de 3 colores desde una imagen (data URL o path).
 *
 * Algoritmo: histograma cuantizado en buckets de 32 niveles por canal RGB,
 * descartando píxeles transparentes, blancos puros y negros puros.
 * Devuelve los 3 buckets más populosos ordenados por frecuencia, oscuro→claro.
 *
 * No es k-means estricto pero es suficientemente bueno para logos con áreas
 * planas de color, que es el caso típico.
 */

const HEX = (n: number) => n.toString(16).padStart(2, '0');

function rgbToHex(r: number, g: number, b: number): string {
  return `#${HEX(r)}${HEX(g)}${HEX(b)}`;
}

function rgbToLuminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface SuggestedPalette {
  primary: string;
  secondary: string;
  tertiary: string;
}

const FALLBACK: SuggestedPalette = {
  primary: '#0F172A',
  secondary: '#0EA5E9',
  tertiary: '#FACC15',
};

export async function extractPaletteFromImage(src: string): Promise<SuggestedPalette> {
  if (typeof window === 'undefined') return FALLBACK;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const MAX = 96;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(FALLBACK);
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
        const STEP = 32;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 200) continue; // skip transparent / semi-transparent
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Descartar grises muy claros / muy oscuros (fondos).
          const lum = rgbToLuminance(r, g, b);
          if (lum > 240 || lum < 12) continue;
          const sat = Math.max(r, g, b) - Math.min(r, g, b);
          if (sat < 10 && lum > 200) continue; // grises claros puros
          const key = `${Math.floor(r / STEP)}-${Math.floor(g / STEP)}-${Math.floor(b / STEP)}`;
          const bucket = buckets.get(key);
          if (bucket) {
            bucket.count++;
            bucket.r += r;
            bucket.g += g;
            bucket.b += b;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }

        if (buckets.size === 0) return resolve(FALLBACK);

        // Top buckets por frecuencia, mediados al promedio del bucket.
        const top = Array.from(buckets.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 12)
          .map((b) => ({
            count: b.count,
            r: Math.round(b.r / b.count),
            g: Math.round(b.g / b.count),
            bb: Math.round(b.b / b.count),
          }));

        // Asegurar que los 3 elegidos sean distintos perceptualmente.
        const picked: typeof top = [];
        for (const c of top) {
          if (picked.length === 3) break;
          const distinct = picked.every((p) => {
            const dr = p.r - c.r;
            const dg = p.g - c.g;
            const db = p.bb - c.bb;
            return Math.sqrt(dr * dr + dg * dg + db * db) > 50;
          });
          if (distinct) picked.push(c);
        }
        // Rellena con copias si no llegamos a 3.
        while (picked.length < 3 && top.length > 0) picked.push(top[0]);

        // Orden: primary = más oscuro, tertiary = más claro.
        picked.sort((a, b) => rgbToLuminance(a.r, a.g, a.bb) - rgbToLuminance(b.r, b.g, b.bb));

        resolve({
          primary: rgbToHex(picked[0].r, picked[0].g, picked[0].bb),
          secondary: rgbToHex(picked[1].r, picked[1].g, picked[1].bb),
          tertiary: rgbToHex(picked[2].r, picked[2].g, picked[2].bb),
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Could not load image for palette extraction'));
    img.src = src;
  });
}
