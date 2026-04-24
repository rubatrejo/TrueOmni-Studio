'use client';

/**
 * Pipeline de composición canvas para el Photo Booth.
 * Capas (bottom → top):
 *   1. Background (imagen del cliente, 1080×1920).
 *   2. Cutout de la persona (frame capturado + mask alpha feathered).
 *   3. Frame overlay (PNG transparente 1080×1920).
 *   4. Stickers (PNG pequeños con x/y/scale/rotation).
 *   5. CSS filter (si hay, se cuece con `ctx.filter`).
 */

export interface StickerPlacement {
  image: HTMLImageElement;
  x: number; // centro x en coords 1080×1920
  y: number; // centro y
  width: number;
  height: number;
  rotation: number; // radianes
}

export interface ComposeInput {
  /** Frame capturado por la cámara (source para drawImage). */
  capture: HTMLImageElement | HTMLVideoElement | ImageBitmap;
  /** Ancho del frame capturado. */
  captureWidth: number;
  /** Alto del frame capturado. */
  captureHeight: number;
  /** Máscara alpha de la persona (0..255). Dimensiones == captureW×captureH. */
  mask: Uint8Array;
  /** Imagen de background (1080×1920 recomendado). */
  background: HTMLImageElement | null;
  /** Frame overlay transparente (1080×1920). */
  frame: HTMLImageElement | null;
  /** Stickers a componer. */
  stickers: readonly StickerPlacement[];
  /** `ctx.filter` CSS aplicado a la composición final. `'none'` para ninguno. */
  cssFilter?: string;
  /** Feather (blur px) aplicado al mask alpha para suavizar edges. Default 3. */
  edgeFeather?: number;
}

const OUT_W = 1080;
const OUT_H = 1920;

/**
 * Canvas helper: crea OffscreenCanvas o HTMLCanvas según disponibilidad.
 */
function createCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function get2d(canvas: AnyCanvas): AnyCtx {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D context');
  return ctx as AnyCtx;
}

/**
 * Dibuja la máscara Uint8 (0..255) en un canvas con blur feather.
 */
function maskToCanvas(
  mask: Uint8Array,
  width: number,
  height: number,
  featherPx: number,
): AnyCanvas {
  const raw = createCanvas(width, height);
  const rawCtx = get2d(raw);
  const imageData = rawCtx.createImageData(width, height);
  for (let i = 0; i < mask.length; i++) {
    const alpha = mask[i]!;
    const j = i * 4;
    imageData.data[j] = 255;
    imageData.data[j + 1] = 255;
    imageData.data[j + 2] = 255;
    imageData.data[j + 3] = alpha;
  }
  rawCtx.putImageData(imageData, 0, 0);
  if (featherPx <= 0) return raw;
  // Blur feather sobre un canvas destino (ctx.filter no funciona con putImageData).
  const blurred = createCanvas(width, height);
  const bCtx = get2d(blurred);
  bCtx.filter = `blur(${featherPx}px)`;
  bCtx.drawImage(raw, 0, 0);
  return blurred;
}

/**
 * Compone la foto final y devuelve un Blob PNG.
 */
export async function composeFinal(input: ComposeInput): Promise<Blob> {
  const {
    capture,
    captureWidth,
    captureHeight,
    mask,
    background,
    frame,
    stickers,
    cssFilter = 'none',
    edgeFeather = 3,
  } = input;

  const out = createCanvas(OUT_W, OUT_H);
  const ctx = get2d(out);

  // 1. Background
  if (background) {
    ctx.drawImage(background, 0, 0, OUT_W, OUT_H);
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
  }

  // 2. Cutout de la persona: pre-rendereamos el frame capturado + máscara
  //    en un canvas auxiliar a la resolución de captura, luego lo escalamos
  //    a 1080×1920 en la salida.
  const personCanvas = createCanvas(captureWidth, captureHeight);
  const personCtx = get2d(personCanvas);
  personCtx.drawImage(capture, 0, 0, captureWidth, captureHeight);
  const maskCanvas = maskToCanvas(mask, captureWidth, captureHeight, edgeFeather);
  personCtx.globalCompositeOperation = 'destination-in';
  personCtx.drawImage(maskCanvas, 0, 0);
  personCtx.globalCompositeOperation = 'source-over';

  // Escalar el personCanvas a la salida. Ajustar a cover (object-fit).
  const captureAspect = captureWidth / captureHeight;
  const outAspect = OUT_W / OUT_H;
  let drawW = OUT_W;
  let drawH = OUT_H;
  let drawX = 0;
  let drawY = 0;
  if (captureAspect > outAspect) {
    // Captura más ancha que 9:16 → crop horizontal
    drawH = OUT_H;
    drawW = OUT_H * captureAspect;
    drawX = (OUT_W - drawW) / 2;
  } else {
    drawW = OUT_W;
    drawH = OUT_W / captureAspect;
    drawY = (OUT_H - drawH) / 2;
  }
  ctx.drawImage(personCanvas, drawX, drawY, drawW, drawH);

  // 3. Frame overlay
  if (frame) {
    ctx.drawImage(frame, 0, 0, OUT_W, OUT_H);
  }

  // 4. Stickers
  for (const s of stickers) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    ctx.drawImage(s.image, -s.width / 2, -s.height / 2, s.width, s.height);
    ctx.restore();
  }

  // 5. Filter final (cuece el filter en la salida)
  if (cssFilter && cssFilter !== 'none') {
    const filtered = createCanvas(OUT_W, OUT_H);
    const fCtx = get2d(filtered);
    fCtx.filter = cssFilter;
    fCtx.drawImage(out, 0, 0);
    // Devuelve el filtered como blob
    return canvasToBlob(filtered);
  }

  return canvasToBlob(out);
}

async function canvasToBlob(canvas: AnyCanvas): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: 'image/png' });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('toBlob devolvió null'));
    }, 'image/png');
  });
}
