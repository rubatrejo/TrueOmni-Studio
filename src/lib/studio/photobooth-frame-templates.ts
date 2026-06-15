import 'server-only';

import sharp from 'sharp';

import { splitNameLines } from './placeholder-image';

/**
 * Plantillas SVG parametrizadas para los frames branded del Photo Booth.
 *
 * Cada plantilla imita el ESTILO/LAYOUT de uno de los 5 frames genéricos
 * (banner pintado arriba con logo · borde de foto + marco · badge + franja ·
 * borde con gradiente), pero auto-rellenado con el branding del cliente
 * (brand colors + logo o nombre + una foto scrapeada de su website).
 *
 * Clave de diseño: el SVG solo pinta sus regiones decorativas (banner, borde,
 * franja) y embebe foto/logo como data-URIs recortados con `clip-path`. Todo lo
 * NO pintado queda transparente → al rasterizar con sharp `.png()` el CENTRO
 * (por donde se ve la persona) es transparente exacto, sin blend-modes.
 */

export const FRAME_WIDTH = 1080;
export const FRAME_HEIGHT = 1920;
export const THUMB_SIZE = 256;

export interface FrameTemplateInput {
  primaryHex: string;
  secondaryHex: string;
  tertiaryHex: string;
  /** Logo del cliente ya resuelto a Buffer (null = usar nombre en texto). */
  logoBuffer: Buffer | null;
  clientName: string;
  /** Foto scrapeada del website (null = degradar a fondo brand). */
  photoBuffer: Buffer | null;
}

/** Contexto puro (sin Buffers) que recibe `buildSvg` — imágenes ya como data-URI. */
export interface FrameSvgContext {
  primaryHex: string;
  secondaryHex: string;
  tertiaryHex: string;
  clientName: string;
  /** Logo como data-URI PNG (null = usar nombre en texto). */
  logoDataUri: string | null;
  /** Foto como data-URI PNG cover 1080×1920 (null = sin foto). */
  photoDataUri: string | null;
}

export interface FrameTemplate {
  /** templateId estable — clave de upsert idempotente al regenerar. */
  id: string;
  /** Label genérico white-label (NUNCA el nombre del cliente). */
  label: string;
  /** Si true, la plantilla usa la foto del website (se intenta scrapear). */
  usesPhoto: boolean;
  /** Construye el SVG 1080×1920 con CENTRO TRANSPARENTE (función pura). */
  buildSvg: (ctx: FrameSvgContext) => string;
}

// ── helpers ────────────────────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Texto del nombre del cliente centrado en una banda (1–2 líneas, color sobre fondo). */
function nameText(clientName: string, cx: number, cy: number, fill: string, maxFont = 64): string {
  const lines = splitNameLines(clientName);
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const fontSize = Math.max(28, Math.min(maxFont, Math.floor(900 / (0.62 * longest))));
  const lineHeight = Math.round(fontSize * 1.12);
  const firstBaseline = cy - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
  return lines
    .map(
      (line, i) =>
        `<text x="${cx}" y="${firstBaseline + i * lineHeight}" text-anchor="middle"
           font-family="Helvetica, Arial, sans-serif" font-weight="700"
           font-size="${fontSize}" fill="${fill}" letter-spacing="1">${escapeXml(line)}</text>`,
    )
    .join('\n');
}

const SVG_OPEN = `<svg width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" viewBox="0 0 ${FRAME_WIDTH} ${FRAME_HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;

/** Logo embebido (data-URI) dentro de una caja, centrado horizontalmente. */
function logoImage(dataUri: string, x: number, y: number, w: number, h: number): string {
  return `<image xlink:href="${dataUri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
}

// ── plantillas (5) ───────────────────────────────────────────────────────────

export const FRAME_TEMPLATES: readonly FrameTemplate[] = [
  // 1) Borde de foto + marco blanco interior + logo/nombre abajo (estilo Visit California).
  {
    id: 'branded-photo-frame',
    label: 'Postcard',
    usesPhoto: true,
    buildSvg: (c) => {
      const m = 70; // margen exterior del borde de foto
      const innerX = m;
      const innerY = m;
      const innerW = FRAME_WIDTH - 2 * m;
      const innerH = FRAME_HEIGHT - 2 * m - 160; // deja banda inferior para logo/nombre
      const footerCy = FRAME_HEIGHT - 130;
      // clip "ring": canvas completo menos el rect interior (fill-rule evenodd) → foto solo en el borde.
      const photoLayer = c.photoDataUri
        ? `<defs><clipPath id="ring" clip-rule="evenodd">
             <path d="M0 0 H${FRAME_WIDTH} V${FRAME_HEIGHT} H0 Z M${innerX} ${innerY} H${innerX + innerW} V${innerY + innerH} H${innerX} Z"/>
           </clipPath></defs>
           <image xlink:href="${c.photoDataUri}" x="0" y="0" width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ring)"/>`
        : // sin foto: borde con gradiente brand
          `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
             <stop offset="0%" stop-color="${escapeXml(c.primaryHex)}"/>
             <stop offset="100%" stop-color="${escapeXml(c.secondaryHex)}"/></linearGradient>
           <clipPath id="ring" clip-rule="evenodd">
             <path d="M0 0 H${FRAME_WIDTH} V${FRAME_HEIGHT} H0 Z M${innerX} ${innerY} H${innerX + innerW} V${innerY + innerH} H${innerX} Z"/>
           </clipPath></defs>
           <rect x="0" y="0" width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" fill="url(#bg)" clip-path="url(#ring)"/>`;
      const footer = c.logoDataUri
        ? logoImage(c.logoDataUri, FRAME_WIDTH / 2 - 230, footerCy - 70, 460, 140)
        : nameText(c.clientName, FRAME_WIDTH / 2, footerCy, '#ffffff', 60);
      return `${SVG_OPEN}
        ${photoLayer}
        <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" fill="none" stroke="#ffffff" stroke-width="16"/>
        ${footer}
      </svg>`;
    },
  },

  // 2) Banner pintado arriba con gradiente brand + logo/nombre (estilo Pocono / Utah Valley).
  {
    id: 'branded-paint-top',
    label: 'Brush',
    usesPhoto: false,
    buildSvg: (c) => {
      const logo = c.logoDataUri
        ? logoImage(c.logoDataUri, FRAME_WIDTH / 2 - 240, 70, 480, 150)
        : nameText(c.clientName, FRAME_WIDTH / 2, 165, '#ffffff', 64);
      // brochazo: polígono orgánico arriba con gradiente primary→secondary.
      return `${SVG_OPEN}
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${escapeXml(c.primaryHex)}"/>
          <stop offset="100%" stop-color="${escapeXml(c.secondaryHex)}"/></linearGradient></defs>
        <path d="M0,0 H1080 V300 C940,360 820,250 700,300 C560,360 420,250 280,300 C170,340 80,280 0,310 Z" fill="url(#g)"/>
        ${logo}
      </svg>`;
    },
  },

  // 3) Banner rasgado arriba-derecha en brand-primary + logo, sobre foto en franja superior (estilo Adventure Coast).
  {
    id: 'branded-torn-banner',
    label: 'Banner',
    usesPhoto: true,
    buildSvg: (c) => {
      const photoStrip = c.photoDataUri
        ? `<defs><clipPath id="strip"><rect x="0" y="0" width="${FRAME_WIDTH}" height="360"/></clipPath></defs>
           <image xlink:href="${c.photoDataUri}" x="0" y="0" width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#strip)"/>`
        : '';
      const logo = c.logoDataUri
        ? logoImage(c.logoDataUri, FRAME_WIDTH - 470, 60, 380, 150)
        : nameText(c.clientName, FRAME_WIDTH - 280, 150, '#ffffff', 52);
      // banner rasgado (polígono con borde irregular) en primary, arriba-derecha.
      return `${SVG_OPEN}
        ${photoStrip}
        <path d="M360,0 H1080 V240 L980,250 L1010,210 L900,235 L940,200 L820,230 L470,190 L520,150 L400,170 L440,120 L360,140 Z" fill="${escapeXml(c.primaryHex)}"/>
        ${logo}
      </svg>`;
    },
  },

  // 4) Badge con logo arriba-derecha + franja inferior brand con nombre (estilo Jessamine).
  {
    id: 'branded-badge-strip',
    label: 'Badge',
    usesPhoto: false,
    buildSvg: (c) => {
      const badge = c.logoDataUri
        ? `<circle cx="${FRAME_WIDTH - 150}" cy="160" r="120" fill="#ffffff"/>
           ${logoImage(c.logoDataUri, FRAME_WIDTH - 250, 80, 200, 160)}`
        : `<circle cx="${FRAME_WIDTH - 150}" cy="160" r="120" fill="${escapeXml(c.primaryHex)}"/>`;
      const stripY = FRAME_HEIGHT - 180;
      return `${SVG_OPEN}
        ${badge}
        <rect x="0" y="${stripY}" width="${FRAME_WIDTH}" height="180" fill="${escapeXml(c.primaryHex)}"/>
        ${nameText(c.clientName, FRAME_WIDTH / 2, stripY + 105, '#ffffff', 60)}
      </svg>`;
    },
  },

  // 5) Borde con gradiente brand (siempre funciona, sin foto) + nombre/logo abajo.
  {
    id: 'branded-border',
    label: 'Frame',
    usesPhoto: false,
    buildSvg: (c) => {
      const bw = 44; // grosor del borde
      const footerCy = FRAME_HEIGHT - 110;
      const footer = c.logoDataUri
        ? logoImage(c.logoDataUri, FRAME_WIDTH / 2 - 200, footerCy - 60, 400, 120)
        : nameText(c.clientName, FRAME_WIDTH / 2, footerCy, '#ffffff', 56);
      return `${SVG_OPEN}
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${escapeXml(c.primaryHex)}"/>
          <stop offset="100%" stop-color="${escapeXml(c.secondaryHex)}"/></linearGradient></defs>
        <rect x="${bw / 2}" y="${bw / 2}" width="${FRAME_WIDTH - bw}" height="${FRAME_HEIGHT - bw}"
          rx="36" fill="none" stroke="url(#g)" stroke-width="${bw}"/>
        ${footer}
      </svg>`;
    },
  },
];

// ── rasterización (sharp) ─────────────────────────────────────────────────────

/** Normaliza un buffer de imagen a un data-URI PNG (sized) para embeber en el SVG. */
async function toPngDataUri(
  buffer: Buffer,
  width: number,
  height: number,
  fit: 'cover' | 'inside',
): Promise<string | null> {
  try {
    const png = await sharp(buffer, { density: 300 })
      .resize(width, height, { fit, withoutEnlargement: fit === 'inside' })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Rasteriza una plantilla a PNG RGBA 1080×1920 con centro transparente.
 * Prepara logo/foto como data-URIs antes de construir el SVG.
 */
export async function renderFramePng(
  tpl: FrameTemplate,
  input: FrameTemplateInput,
): Promise<Buffer> {
  const logoDataUri = input.logoBuffer
    ? await toPngDataUri(input.logoBuffer, 520, 320, 'inside')
    : null;
  const photoDataUri =
    tpl.usesPhoto && input.photoBuffer
      ? await toPngDataUri(input.photoBuffer, FRAME_WIDTH, FRAME_HEIGHT, 'cover')
      : null;
  const svg = tpl.buildSvg({
    primaryHex: input.primaryHex,
    secondaryHex: input.secondaryHex,
    tertiaryHex: input.tertiaryHex,
    clientName: input.clientName,
    logoDataUri,
    photoDataUri,
  });
  return sharp(Buffer.from(svg, 'utf8'))
    .resize(FRAME_WIDTH, FRAME_HEIGHT, { fit: 'fill' })
    .png()
    .toBuffer();
}

/**
 * Deriva el thumbnail cuadrado (256²) del PNG del frame. Lo compone sobre un
 * fondo gris neutro claro para que el centro transparente no se vea hueco en el
 * carousel del editor/runtime.
 */
export async function renderFrameThumbnail(framePng: Buffer): Promise<Buffer> {
  const scaled = await sharp(framePng).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).toBuffer();
  return sharp({
    create: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      channels: 4,
      background: { r: 235, g: 235, b: 237, alpha: 1 },
    },
  })
    .composite([{ input: scaled }])
    .png()
    .toBuffer();
}
