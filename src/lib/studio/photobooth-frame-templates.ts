import 'server-only';

import { type Font, parse as parseFont } from 'opentype.js';
import sharp from 'sharp';

import { ROBOTO_BOLD_BASE64 } from './fonts/roboto-bold';
import { splitNameLines } from './placeholder-image';

/**
 * TODO el texto de los frames se VECTORIZA a paths SVG con opentype.js. Motivo:
 * librsvg (motor de sharp) NO tiene fuentes del sistema en el entorno serverless
 * de Vercel, así que cualquier `<text>` sale como TOFU (□□□). Al convertir el
 * texto a `<path>` (geometría pura) el render NO depende de ninguna fuente del
 * entorno y es idéntico en local y en producción.
 *
 * La fuente usada es la DISPLAY del branding del cliente (resuelta a TTF/OTF);
 * si no se puede resolver, se cae a esta Roboto Bold embebida por defecto.
 */
export const DEFAULT_FONT: Font = (() => {
  const buf = Buffer.from(ROBOTO_BOLD_BASE64, 'base64');
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return parseFont(ab);
})();

/** Parsea un Buffer de fuente (TTF/OTF/WOFF) a `Font`; `null`/fallo → `null`. */
export function parseFontBuffer(buffer: Buffer | null): Font | null {
  if (!buffer) return null;
  try {
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    return parseFont(ab);
  } catch {
    return null;
  }
}

/** Ancho (px) que ocupa `text` a `fontSize` con `font`. */
function measureText(font: Font, text: string, fontSize: number): number {
  return font.getAdvanceWidth(text, fontSize);
}

/** Una línea de texto como `<path>` vectorizado. `x` ya viene ajustado al anchor. */
function glyphPath(
  font: Font,
  text: string,
  x: number,
  baseline: number,
  fontSize: number,
  fill: string,
): string {
  const path = font.getPath(text, x, baseline, fontSize);
  return `<path d="${path.toPathData(1)}" fill="${fill}"/>`;
}

/**
 * Bloque de texto (1+ líneas) vectorizado y alineado. `cy` es el centro
 * vertical del bloque; `anchor` controla el alineado horizontal respecto a `cx`.
 */
function textBlock(
  font: Font,
  lines: string[],
  cx: number,
  cy: number,
  fontSize: number,
  fill: string,
  anchor: 'start' | 'middle' | 'end',
  lineHeight: number,
): string {
  const firstBaseline = cy - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
  return lines
    .map((line, i) => {
      const w = measureText(font, line, fontSize);
      const x = anchor === 'start' ? cx : anchor === 'end' ? cx - w : cx - w / 2;
      return glyphPath(font, line, x, firstBaseline + i * lineHeight, fontSize, fill);
    })
    .join('\n');
}

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
  /** Texto editable de ESTE frame (frase o hashtag según la plantilla; vacío = se omite). */
  text: string;
  /** Fuente Display del cliente ya parseada (null = usar Roboto Bold por defecto). */
  displayFont?: Font | null;
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
  /** Texto editable de este frame (frase o hashtag; vacío = se omite). */
  text: string;
  /** Fuente con la que se vectoriza TODO el texto del frame. */
  font: Font;
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

/** Nombre del cliente centrado (1–2 líneas), vectorizado y escalado a ≤900px de ancho. */
function nameText(
  font: Font,
  clientName: string,
  cx: number,
  cy: number,
  fill: string,
  maxFont = 64,
): string {
  const lines = splitNameLines(clientName);
  const widthCap = 900;
  const widest = Math.max(...lines.map((l) => measureText(font, l, maxFont)), 1);
  const fontSize =
    widest > widthCap ? Math.max(24, Math.floor((maxFont * widthCap) / widest)) : maxFont;
  const lineHeight = Math.round(fontSize * 1.14);
  return textBlock(font, lines, cx, cy, fontSize, fill, 'middle', lineHeight);
}

/**
 * Frase/tagline vectorizada, con `text-anchor` configurable (`start`/`middle`/
 * `end`). Reparte en 1–2 líneas (salvo `singleLine`) y reduce el tamaño solo si
 * no cabe en `widthPx`. `cx` es el punto de anclaje según el anchor.
 */
function taglineText(
  font: Font,
  text: string,
  cx: number,
  cy: number,
  fill: string,
  anchor: 'start' | 'middle' | 'end' = 'middle',
  maxFont = 46,
  opts?: { singleLine?: boolean; widthPx?: number },
): string {
  const lines = opts?.singleLine ? [text.trim().replace(/\s+/g, ' ')] : splitNameLines(text);
  const widthPx = opts?.widthPx ?? 820;
  const widest = Math.max(...lines.map((l) => measureText(font, l, maxFont)), 1);
  const fontSize =
    widest > widthPx ? Math.max(22, Math.floor((maxFont * widthPx) / widest)) : maxFont;
  const lineHeight = Math.round(fontSize * 1.18);
  return textBlock(font, lines, cx, cy, fontSize, fill, anchor, lineHeight);
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
        : nameText(c.font, c.clientName, FRAME_WIDTH / 2, footerCy, '#ffffff', 60);
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
        : nameText(c.font, c.clientName, FRAME_WIDTH / 2, 165, '#ffffff', 64);
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

  // 3) Barra inferior sólida brand con logo/nombre centrado.
  {
    id: 'branded-bottom-bar',
    label: 'Bottom Bar',
    usesPhoto: false,
    buildSvg: (c) => {
      const barH = 280;
      const barY = FRAME_HEIGHT - barH;
      const content = c.logoDataUri
        ? logoImage(c.logoDataUri, FRAME_WIDTH / 2 - 260, barY + barH / 2 - 80, 520, 160)
        : nameText(c.font, c.clientName, FRAME_WIDTH / 2, barY + barH / 2, '#ffffff', 68);
      return `${SVG_OPEN}
        <rect x="0" y="${barY}" width="${FRAME_WIDTH}" height="${barH}" fill="${escapeXml(c.primaryHex)}"/>
        ${content}
      </svg>`;
    },
  },

  // 4) Corchetes en L brand en las 4 esquinas + nombre en pill inferior (minimalista).
  {
    id: 'branded-corner-brackets',
    label: 'Corners',
    usesPhoto: false,
    buildSvg: (c) => {
      const m = 64;
      const arm = 250;
      const th = 30;
      const fill = escapeXml(c.primaryHex);
      const W = FRAME_WIDTH;
      const H = FRAME_HEIGHT;
      const corners = [
        // top-left
        `<rect x="${m}" y="${m}" width="${arm}" height="${th}" fill="${fill}"/>
         <rect x="${m}" y="${m}" width="${th}" height="${arm}" fill="${fill}"/>`,
        // top-right
        `<rect x="${W - m - arm}" y="${m}" width="${arm}" height="${th}" fill="${fill}"/>
         <rect x="${W - m - th}" y="${m}" width="${th}" height="${arm}" fill="${fill}"/>`,
        // bottom-left
        `<rect x="${m}" y="${H - m - th}" width="${arm}" height="${th}" fill="${fill}"/>
         <rect x="${m}" y="${H - m - arm}" width="${th}" height="${arm}" fill="${fill}"/>`,
        // bottom-right
        `<rect x="${W - m - arm}" y="${H - m - th}" width="${arm}" height="${th}" fill="${fill}"/>
         <rect x="${W - m - th}" y="${H - m - arm}" width="${th}" height="${arm}" fill="${fill}"/>`,
      ].join('\n');
      // pill inferior con el nombre (legible sobre el centro transparente).
      const pillW = 520;
      const pillH = 96;
      const pillX = W / 2 - pillW / 2;
      const pillY = H - 230;
      const label = c.logoDataUri
        ? logoImage(c.logoDataUri, W / 2 - 200, pillY - 150, 400, 130)
        : `<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${fill}"/>
           ${nameText(c.font, c.clientName, W / 2, pillY + pillH / 2, '#ffffff', 46)}`;
      return `${SVG_OPEN}
        ${corners}
        ${label}
      </svg>`;
    },
  },

  // 5) Bandas brand arriba (logo) + abajo (nombre).
  {
    id: 'branded-top-bottom-bands',
    label: 'Bands',
    usesPhoto: false,
    buildSvg: (c) => {
      const bandH = 230;
      const top = c.logoDataUri
        ? logoImage(c.logoDataUri, FRAME_WIDTH / 2 - 240, bandH / 2 - 75, 480, 150)
        : nameText(c.font, c.clientName, FRAME_WIDTH / 2, bandH / 2, '#ffffff', 60);
      // Banda inferior: hashtag editable centrado.
      const bottom = c.text
        ? taglineText(
            c.font,
            c.text,
            FRAME_WIDTH / 2,
            FRAME_HEIGHT - bandH / 2,
            '#ffffff',
            'middle',
            68,
            {
              singleLine: true,
              widthPx: 980,
            },
          )
        : nameText(c.font, c.clientName, FRAME_WIDTH / 2, FRAME_HEIGHT - bandH / 2, '#ffffff', 64);
      return `${SVG_OPEN}
        <rect x="0" y="0" width="${FRAME_WIDTH}" height="${bandH}" fill="${escapeXml(c.primaryHex)}"/>
        <rect x="0" y="${FRAME_HEIGHT - bandH}" width="${FRAME_WIDTH}" height="${bandH}" fill="${escapeXml(c.secondaryHex)}"/>
        ${top}
        ${bottom}
      </svg>`;
    },
  },

  // 6) Borde ancho con gradiente brand, ESQUINAS RECTAS + nombre/logo abajo.
  {
    id: 'branded-border',
    label: 'Frame',
    usesPhoto: false,
    buildSvg: (c) => {
      const bw = 96; // grosor del borde (ancho)
      // Footer despegado del borde inferior (deja aire entre logo y stroke).
      const footerCy = FRAME_HEIGHT - 250;
      const footer = c.logoDataUri
        ? logoImage(c.logoDataUri, FRAME_WIDTH / 2 - 200, footerCy - 60, 400, 120)
        : nameText(c.font, c.clientName, FRAME_WIDTH / 2, footerCy, '#ffffff', 52);
      return `${SVG_OPEN}
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${escapeXml(c.primaryHex)}"/>
          <stop offset="100%" stop-color="${escapeXml(c.secondaryHex)}"/></linearGradient></defs>
        <rect x="${bw / 2}" y="${bw / 2}" width="${FRAME_WIDTH - bw}" height="${FRAME_HEIGHT - bw}"
          fill="none" stroke="url(#g)" stroke-width="${bw}"/>
        ${footer}
      </svg>`;
    },
  },

  // 7) Solo el logo del cliente centrado abajo (minimalista). (ref Frame-1)
  {
    id: 'branded-logo-bottom',
    label: 'Logo',
    usesPhoto: false,
    buildSvg: (c) => {
      const cy = FRAME_HEIGHT - 230;
      const content = c.logoDataUri
        ? logoImage(c.logoDataUri, FRAME_WIDTH / 2 - 300, cy - 95, 600, 190)
        : nameText(c.font, c.clientName, FRAME_WIDTH / 2, cy, escapeXml(c.primaryHex), 76);
      return `${SVG_OPEN}${content}</svg>`;
    },
  },

  // 8) Banda inferior con cuña diagonal (olive + tan a la derecha); logo abajo-izq
  //    + tagline abajo-der en una línea. (ref Frame-2 Discover DeKalb)
  {
    id: 'branded-angled-band',
    label: 'Angled',
    usesPhoto: false,
    buildSvg: (c) => {
      const W = FRAME_WIDTH;
      const H = FRAME_HEIGHT;
      // Banda olive con borde superior diagonal (sube ligeramente a la derecha).
      const band = `<polygon points="0,1700 ${W},1610 ${W},${H} 0,${H}" fill="${escapeXml(c.secondaryHex)}"/>`;
      // Cuña tan/gold en la esquina inferior-derecha (divisor diagonal).
      const wedge = `<polygon points="745,1614 ${W},1606 ${W},${H} 560,${H}" fill="${escapeXml(c.tertiaryHex)}"/>`;
      const logo = c.logoDataUri
        ? logoImage(c.logoDataUri, 64, 1742, 380, 150)
        : nameText(c.font, c.clientName, 250, H - 130, '#ffffff', 48);
      const tag = c.text
        ? taglineText(c.font, c.text, W - 56, 1822, '#ffffff', 'end', 58, {
            widthPx: 620,
          })
        : '';
      return `${SVG_OPEN}${band}${wedge}${logo}${tag}</svg>`;
    },
  },

  // 9) Borde sólido brand: banda superior (logo) + banda inferior (tagline) + lados finos. (ref Frame-3)
  {
    id: 'branded-solid-border-tab',
    label: 'Border Tab',
    usesPhoto: false,
    buildSvg: (c) => {
      const side = 70;
      const topH = 250;
      const botH = 170;
      const W = FRAME_WIDTH;
      const H = FRAME_HEIGHT;
      // ring sólido = canvas completo menos el rect interior (centro transparente).
      const ring = `<defs><clipPath id="r9" clip-rule="evenodd">
        <path d="M0 0 H${W} V${H} H0 Z M${side} ${topH} H${W - side} V${H - botH} H${side} Z"/>
      </clipPath></defs>
      <rect x="0" y="0" width="${W}" height="${H}" fill="${escapeXml(c.primaryHex)}" clip-path="url(#r9)"/>`;
      const logo = c.logoDataUri
        ? logoImage(c.logoDataUri, 80, 50, 420, 150)
        : nameText(c.font, c.clientName, W / 2, topH / 2 + 10, '#ffffff', 56);
      // Frase en la banda inferior: CENTRADA, en UN solo renglón (feedback Rubén).
      const tag = c.text
        ? taglineText(c.font, c.text, W / 2, H - botH / 2, '#ffffff', 'middle', 60, {
            singleLine: true,
            widthPx: W - 2 * side - 60,
          })
        : '';
      return `${SVG_OPEN}${ring}${logo}${tag}</svg>`;
    },
  },

  // 10) Brackets angulares entrelazados: bracket olive arriba-izq (tagline) +
  //     bracket navy abajo-der (logo); centro transparente en molinete. (ref Frame-4)
  {
    id: 'branded-diagonal-corners',
    label: 'Diagonal',
    usesPhoto: false,
    buildSvg: (c) => {
      const W = FRAME_WIDTH;
      const H = FRAME_HEIGHT;
      // Bracket olive (banda superior + franja izquierda) con extremos en diagonal.
      const topLeft = `<polygon points="0,0 875,0 775,210 210,210 210,1080 0,1290" fill="${escapeXml(c.secondaryHex)}"/>`;
      // Bracket navy abajo-der = mismo bracket rotado 180° respecto al centro.
      const bottomRight = `<polygon points="870,840 ${W},630 ${W},${H} 205,${H} 305,1710 870,1710" fill="${escapeXml(c.primaryHex)}"/>`;
      // Frase en la banda olive superior: IZQUIERDA, en UN solo renglón (feedback Rubén).
      const tag = c.text
        ? taglineText(c.font, c.text, 55, 116, '#ffffff', 'start', 52, {
            singleLine: true,
            widthPx: 760,
          })
        : '';
      // Logo centrado en la banda navy inferior.
      const logo = c.logoDataUri
        ? logoImage(c.logoDataUri, W / 2 - 210, 1748, 420, 130)
        : nameText(c.font, c.clientName, W / 2, H - 110, '#ffffff', 46);
      return `${SVG_OPEN}${topLeft}${bottomRight}${tag}${logo}</svg>`;
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
    text: input.text,
    font: input.displayFont ?? DEFAULT_FONT,
  });
  return sharp(Buffer.from(svg, 'utf8'))
    .resize(FRAME_WIDTH, FRAME_HEIGHT, { fit: 'fill' })
    .png()
    .toBuffer();
}

/**
 * Deriva el thumbnail cuadrado (256²) del PNG del frame. Lo compone sobre un
 * fondo con el gradiente brand para que CUBRA TODO el círculo del selector (sin
 * centro hueco). Usa `fit: 'inside'` para que la decoración top/bottom del frame
 * no se recorte; el gradiente rellena los costados.
 */
export async function renderFrameThumbnail(
  framePng: Buffer,
  colors: { primaryHex: string; secondaryHex: string },
): Promise<Buffer> {
  const gradientSvg = `<svg width="${THUMB_SIZE}" height="${THUMB_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(colors.primaryHex)}"/>
      <stop offset="100%" stop-color="${escapeXml(colors.secondaryHex)}"/></linearGradient></defs>
    <rect width="${THUMB_SIZE}" height="${THUMB_SIZE}" fill="url(#g)"/></svg>`;
  const bg = await sharp(Buffer.from(gradientSvg)).png().toBuffer();
  const scaled = await sharp(framePng).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside' }).toBuffer();
  return sharp(bg)
    .composite([{ input: scaled, gravity: 'center' }])
    .png()
    .toBuffer();
}
