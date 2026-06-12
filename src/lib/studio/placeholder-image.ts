import 'server-only';

import sharp from 'sharp';

/**
 * Generación del **Fallback/Placeholder image** (16:9) de un cliente:
 * foto relevante scrapeada de su website + capa oscura + logo (o nombre del
 * cliente en texto cuando aún no hay logo real) centrado. Réplica del estilo
 * de referencia aprobado (Discover Dekalb `asset 28.jpeg`).
 *
 * Este módulo contiene los helpers puros (parsing/normalización, testeables
 * sin red) y la composición con sharp. La orquestación con KV/Blob vive en
 * `placeholder-generate.ts`.
 */

export const PLACEHOLDER_WIDTH = 1280;
export const PLACEHOLDER_HEIGHT = 720;

/** Ancho mínimo para considerar una foto del website utilizable. */
const MIN_PHOTO_WIDTH = 800;
/** Máx. candidatas a descargar antes de rendirnos con el website. */
const MAX_DOWNLOAD_ATTEMPTS = 6;
const FETCH_TIMEOUT_MS = 8_000;
/** Algunos CMS bloquean UAs no-browser; nos presentamos como Chrome. */
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ---------------------------------------------------------------------------
//  Helpers puros (testeables sin red)
// ---------------------------------------------------------------------------

/** Normaliza el website del cliente a una URL http(s) absoluta, o `null`. */
export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Extrae los pares atributo→valor de un tag HTML (suficiente para metas). */
function tagAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? '';
  }
  return attrs;
}

/**
 * Candidatas de imagen de un HTML, en orden de confianza:
 * `og:image` → `twitter:image` → `link rel=image_src` → `<img>` del documento.
 * Devuelve URLs absolutas http(s), dedupeadas, máx. 12. Filtra SVG/GIF/data:.
 */
export function extractImageCandidates(html: string, baseUrl: string): string[] {
  const metaPriority = ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src'];
  const fromMeta: string[][] = metaPriority.map(() => []);
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = tagAttrs(tag);
    const key = (attrs.property ?? attrs.name ?? '').toLowerCase();
    const idx = metaPriority.indexOf(key);
    if (idx >= 0 && attrs.content) fromMeta[idx].push(attrs.content);
  }

  const fromLink: string[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attrs = tagAttrs(tag);
    if ((attrs.rel ?? '').toLowerCase() === 'image_src' && attrs.href) fromLink.push(attrs.href);
  }

  const fromImg: string[] = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const attrs = tagAttrs(tag);
    const src = attrs.src || attrs['data-src'] || attrs['data-lazy-src'] || '';
    if (src) fromImg.push(src);
    if (fromImg.length >= 24) break;
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...fromMeta.flat(), ...fromLink, ...fromImg]) {
    if (raw.startsWith('data:')) continue;
    let abs: string;
    try {
      const url = new URL(raw, baseUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
      abs = url.toString();
    } catch {
      continue;
    }
    if (/\.(svg|gif)(\?|#|$)/i.test(abs)) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);
    out.push(abs);
    if (out.length >= 12) break;
  }
  return out;
}

/** Escapa texto para meterlo en un `<text>` SVG. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parte el nombre del cliente en 1–2 líneas balanceadas (corta por el espacio
 * más cercano a la mitad cuando es largo). Exportada para tests.
 */
export function splitNameLines(name: string): string[] {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length <= 16 || !clean.includes(' ')) return [clean];
  const mid = clean.length / 2;
  let best = -1;
  for (let i = clean.indexOf(' '); i >= 0; i = clean.indexOf(' ', i + 1)) {
    if (best === -1 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  }
  return [clean.slice(0, best), clean.slice(best + 1)];
}

// ---------------------------------------------------------------------------
//  Scraping (red)
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  return fetch(url, {
    headers: { 'user-agent': BROWSER_UA, accept },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

/**
 * Descarga la homepage del website y devuelve la primera candidata utilizable
 * (raster, ancho ≥ 800px) como Buffer, o `null` si el sitio no da nada.
 * Nunca lanza: cualquier fallo de red/parseo degrada a `null`.
 */
export async function scrapeBestImage(websiteUrl: string): Promise<Buffer | null> {
  let html: string;
  try {
    const res = await fetchWithTimeout(websiteUrl, 'text/html,application/xhtml+xml');
    if (!res.ok) return null;
    html = (await res.text()).slice(0, 1_500_000);
  } catch {
    return null;
  }

  const candidates = extractImageCandidates(html, websiteUrl).slice(0, MAX_DOWNLOAD_ATTEMPTS);
  for (const candidate of candidates) {
    try {
      const res = await fetchWithTimeout(candidate, 'image/*');
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType && !contentType.startsWith('image/')) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buffer).metadata();
      if (meta.format === 'svg' || meta.format === 'gif') continue;
      if ((meta.width ?? 0) < MIN_PHOTO_WIDTH) continue;
      return buffer;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Resuelve el logo del branding a un Buffer. Soporta blob URLs http(s) y
 * data-URIs (lo que produce el editor de Branding del Studio). Un path fs del
 * template (`assets/...`) significa "el cliente aún no subió su logo real" →
 * `null`, y la composición usa el nombre del cliente (decisión brainstorming).
 */
export async function resolveLogoBuffer(logoRef: string): Promise<Buffer | null> {
  const ref = logoRef.trim();
  if (!ref) return null;

  if (ref.startsWith('data:image/')) {
    const comma = ref.indexOf(',');
    if (comma === -1) return null;
    const head = ref.slice(0, comma);
    const body = ref.slice(comma + 1);
    try {
      return head.includes(';base64')
        ? Buffer.from(body, 'base64')
        : Buffer.from(decodeURIComponent(body), 'utf8');
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(ref)) {
    try {
      const res = await fetchWithTimeout(ref, 'image/*');
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
//  Composición (sharp)
// ---------------------------------------------------------------------------

export interface ComposePlaceholderOptions {
  /** Foto de fondo (raster). Si falta → gradiente con los brand colors. */
  photo?: Buffer | null;
  /** Logo del cliente (PNG/SVG/JPEG). Si falta → nombre en texto. */
  logo?: Buffer | null;
  /** Nombre del cliente, usado como centro cuando no hay logo. */
  clientName: string;
  /** Brand colors en hex `#RRGGBB` (gradiente de fallback). */
  brandPrimaryHex: string;
  brandSecondaryHex: string;
}

function gradientBackgroundSvg(primaryHex: string, secondaryHex: string): Buffer {
  return Buffer.from(
    `<svg width="${PLACEHOLDER_WIDTH}" height="${PLACEHOLDER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${escapeXml(primaryHex)}"/>
          <stop offset="100%" stop-color="${escapeXml(secondaryHex)}"/>
        </linearGradient>
      </defs>
      <rect width="${PLACEHOLDER_WIDTH}" height="${PLACEHOLDER_HEIGHT}" fill="url(#g)"/>
    </svg>`,
  );
}

function nameTextSvg(clientName: string): Buffer {
  const lines = splitNameLines(clientName);
  const longest = Math.max(...lines.map((l) => l.length), 1);
  // Ancho útil ~1100px; bold sans ≈ 0.6em por carácter.
  const fontSize = Math.max(40, Math.min(92, Math.floor(1100 / (0.6 * longest))));
  const lineHeight = Math.round(fontSize * 1.12);
  const centerY = PLACEHOLDER_HEIGHT / 2;
  const firstBaseline = centerY - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;

  const layer = (fill: string, opacity: number, dy: number) =>
    lines
      .map(
        (line, i) =>
          `<text x="${PLACEHOLDER_WIDTH / 2}" y="${firstBaseline + i * lineHeight + dy}"
             text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
             font-weight="700" font-size="${fontSize}" fill="${fill}"
             opacity="${opacity}">${escapeXml(line)}</text>`,
      )
      .join('\n');

  return Buffer.from(
    `<svg width="${PLACEHOLDER_WIDTH}" height="${PLACEHOLDER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      ${layer('#000000', 0.35, 4)}
      ${layer('#ffffff', 1, 0)}
    </svg>`,
  );
}

function looksLikeSvg(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 512).toString('utf8').trimStart();
  return head.startsWith('<') && /<svg[\s>]/i.test(head);
}

/**
 * Compone el placeholder 1280×720: fondo (foto cover o gradiente brand) +
 * capa negra al 50% + logo o nombre centrado. Devuelve JPEG (quality 82).
 * El negro de la capa es neutro intencional (chrome, no brandeable), igual
 * que la referencia aprobada.
 */
export async function composePlaceholder(opts: ComposePlaceholderOptions): Promise<Buffer> {
  const background = opts.photo
    ? await sharp(opts.photo)
        .resize(PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT, { fit: 'cover' })
        .toBuffer()
    : await sharp(gradientBackgroundSvg(opts.brandPrimaryHex, opts.brandSecondaryHex))
        .png()
        .toBuffer();

  const overlays: sharp.OverlayOptions[] = [
    {
      input: {
        create: {
          width: PLACEHOLDER_WIDTH,
          height: PLACEHOLDER_HEIGHT,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0.5 },
        },
      },
    },
  ];

  let centered: Buffer | null = null;
  if (opts.logo) {
    try {
      const isSvg = looksLikeSvg(opts.logo);
      centered = await sharp(opts.logo, isSvg ? { density: 300 } : undefined)
        .resize(560, 280, { fit: 'inside', withoutEnlargement: !isSvg })
        .png()
        .toBuffer();
    } catch {
      centered = null; // logo corrupto → degradar al nombre
    }
  }
  if (!centered) {
    centered = await sharp(nameTextSvg(opts.clientName)).png().toBuffer();
  }
  overlays.push({ input: centered, gravity: 'center' });

  return sharp(background).composite(overlays).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}
