'use client';

import type { ImageSegmenter } from '@mediapipe/tasks-vision';

/**
 * Singleton de MediaPipe SelfieSegmenter. Evita recrear el modelo entre
 * capturas (warm-up de 500–1500 ms la 1ª vez). Lazy-loaded via dynamic
 * import para que los ~1–2 MB del bundle solo se descarguen al entrar a
 * `/home/photo-booth`.
 */
let segmenterPromise: Promise<ImageSegmenter> | null = null;

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite';

async function createSegmenter(): Promise<ImageSegmenter> {
  const { FilesetResolver, ImageSegmenter: Segmenter } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm',
  );
  return Segmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: 'IMAGE',
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  });
}

/**
 * Precarga el modelo. Llamar al montar `/home/photo-booth` para que la
 * inferencia posterior sea instantánea. Idempotente.
 */
export function warmupSegmenter(): void {
  if (segmenterPromise) return;
  segmenterPromise = createSegmenter().catch((err) => {
    // Si falla la precarga (p.ej. offline), resetear para reintentar más tarde.
    segmenterPromise = null;
    throw err;
  });
}

/**
 * Segmenta la persona del fondo en una imagen. Devuelve la máscara alpha
 * (Uint8Array de 0..255 donde 255 = persona foreground) con las
 * dimensiones originales del bitmap.
 */
export async function segmentSelfie(
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | HTMLCanvasElement,
): Promise<{ mask: Uint8Array; width: number; height: number }> {
  if (!segmenterPromise) warmupSegmenter();
  const segmenter = await segmenterPromise!;
  const result = segmenter.segment(source);
  const mask = result.confidenceMasks?.[0];
  if (!mask) {
    throw new Error('MediaPipe no devolvió máscara');
  }
  // La mask es Float32Array (0..1). Convertimos a Uint8 (0..255) para el canvas.
  const floatData = mask.getAsFloat32Array();
  const width = mask.width;
  const height = mask.height;
  const bytes = new Uint8Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    bytes[i] = Math.round(floatData[i]! * 255);
  }
  mask.close();
  result.close();
  return { mask: bytes, width, height };
}
