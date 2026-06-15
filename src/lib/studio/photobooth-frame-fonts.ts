import 'server-only';

/**
 * Resolución de la fuente de marca del cliente para EMBEBERLA en los SVG de los
 * frames branded del Photo Booth (feedback Rubén 2026-06-15: la frase/tagline
 * debe salir "con la tipografía del cliente").
 *
 * librsvg (el motor que usa sharp) solo conoce fuentes del SISTEMA, así que para
 * usar la fuente de marca hay que incrustarla como `@font-face` con un data-URI:
 *   - fuente custom subida por el operador → ya es un data-URI (uso directo).
 *   - nombre de Google Font (Montserrat, Poppins…) → se descarga el woff2 y se
 *     convierte a base64 (best-effort; si falla, se cae a la sans del sistema).
 */

const FONT_TIMEOUT_MS = 6000;
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface EmbeddedFont {
  /** Nombre de family a usar en `font-family` del SVG. */
  family: string;
  /** `data:font/...;base64,…` listo para `@font-face`. */
  dataUri: string;
  /** Formato declarado (`woff2`/`woff`/`ttf`/`otf`). */
  format: string;
}

interface BrandFontsSpec {
  display?: string;
  body?: string;
  displayCustom?: { name: string; dataUrl: string; format: string };
  bodyCustom?: { name: string; dataUrl: string; format: string };
}

/**
 * Resuelve la fuente DISPLAY (titulares) del cliente a una fuente embebible.
 * Devuelve `null` si no hay fuente utilizable → el caller cae a Helvetica/Arial.
 */
export async function resolveBrandDisplayFont(
  fonts: BrandFontsSpec | undefined,
): Promise<EmbeddedFont | null> {
  if (!fonts) return null;
  // 1) Custom subido por el operador (ya es data-URI).
  const custom = fonts.displayCustom;
  if (custom?.dataUrl?.startsWith('data:')) {
    return { family: custom.name, dataUri: custom.dataUrl, format: custom.format };
  }
  // 2) Google Font por nombre.
  const name = (fonts.display ?? '').trim();
  if (!name) return null;
  return fetchGoogleFont(name);
}

/** Descarga un woff2 de Google Fonts (weight 700) y lo devuelve como data-URI. */
async function fetchGoogleFont(family: string): Promise<EmbeddedFont | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@700&display=swap`;
    const cssRes = await fetch(cssUrl, {
      headers: { 'user-agent': BROWSER_UA },
      signal: AbortSignal.timeout(FONT_TIMEOUT_MS),
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    // El primer src woff2 (subset latin) basta para nuestro texto ASCII.
    const m = css.match(/url\((https:\/\/[^)]+\.woff2)\)/);
    if (!m) return null;
    const fontRes = await fetch(m[1], {
      headers: { 'user-agent': BROWSER_UA },
      signal: AbortSignal.timeout(FONT_TIMEOUT_MS),
    });
    if (!fontRes.ok) return null;
    const b64 = Buffer.from(await fontRes.arrayBuffer()).toString('base64');
    return { family, dataUri: `data:font/woff2;base64,${b64}`, format: 'woff2' };
  } catch {
    return null;
  }
}

/** Bloque `<style>` con el `@font-face` para incrustar al inicio del SVG. */
export function fontFaceStyle(font: EmbeddedFont): string {
  const family = font.family.replace(/'/g, '');
  return `<style>@font-face{font-family:'${family}';src:url('${font.dataUri}') format('${font.format}');font-weight:700;font-style:normal;}</style>`;
}

/** `font-family` CSS (brand font con fallback de sistema), o solo la sans si no hay font. */
export function taglineFontFamily(font: EmbeddedFont | null): string {
  if (!font) return 'Helvetica, Arial, sans-serif';
  const family = font.family.replace(/'/g, '');
  return `'${family}', Helvetica, Arial, sans-serif`;
}
