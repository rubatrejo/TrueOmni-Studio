import 'server-only';

/**
 * Resuelve la fuente DISPLAY del branding del cliente a un Buffer TTF/OTF que
 * opentype.js pueda parsear (para VECTORIZAR el texto de los frames con la
 * tipografía de la marca). Devuelve `null` si no hay fuente utilizable → el
 * caller cae a la fuente por defecto (Roboto Bold).
 *
 * Nota: opentype.js lee TTF/OTF/WOFF, NO woff2. Por eso para las Google Fonts
 * pedimos el CSS con un User-Agent antiguo (la CSS1 API devuelve URLs .ttf en
 * vez de .woff2).
 */

const FONT_TIMEOUT_MS = 6000;
// UA antiguo → Google Fonts CSS1 sirve TTF (no woff2).
const TTF_UA = 'Mozilla/4.0';

interface BrandFontsSpec {
  display?: string;
  displayCustom?: { name: string; dataUrl: string; format: string };
}

export async function resolveDisplayFontBuffer(
  fonts: BrandFontsSpec | undefined,
): Promise<Buffer | null> {
  if (!fonts) return null;

  // 1) Fuente custom subida por el operador. opentype lee ttf/otf/woff (no woff2).
  const custom = fonts.displayCustom;
  if (custom?.dataUrl?.startsWith('data:') && ['ttf', 'otf', 'woff'].includes(custom.format)) {
    const buf = dataUrlToBuffer(custom.dataUrl);
    if (buf) return buf;
  }

  // 2) Google Font por nombre → descargar su TTF.
  const name = (fonts.display ?? '').trim();
  if (name) {
    const ttf = await fetchGoogleTtf(name);
    if (ttf) return ttf;
  }

  return null;
}

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return null;
  const meta = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  try {
    return meta.includes(';base64')
      ? Buffer.from(body, 'base64')
      : Buffer.from(decodeURIComponent(body), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Descarga el TTF de una Google Font por nombre. Pide 700 (bold) y 400 (regular)
 * y prefiere el 700 si existe — pero NO falla si la fuente solo tiene 400 (p. ej.
 * muchas script/display fonts traen un único weight).
 */
async function fetchGoogleTtf(family: string): Promise<Buffer | null> {
  try {
    const cssRes = await fetch(
      `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:700,400`,
      { headers: { 'user-agent': TTF_UA }, signal: AbortSignal.timeout(FONT_TIMEOUT_MS) },
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    // Todas las URLs .ttf del CSS, en orden de aparición (700 primero si existe).
    const urls = [...css.matchAll(/url\((https:\/\/[^)]+\.ttf)\)/g)].map((m) => m[1]);
    if (urls.length === 0) return null;
    const fontRes = await fetch(urls[0], { signal: AbortSignal.timeout(FONT_TIMEOUT_MS) });
    if (!fontRes.ok) return null;
    return Buffer.from(await fontRes.arrayBuffer());
  } catch {
    return null;
  }
}
