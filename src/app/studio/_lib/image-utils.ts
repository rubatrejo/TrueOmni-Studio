'use client';

/**
 * Convierte un `File` a data URL (`data:image/png;base64,...`). Útil para
 * logos/favicons mientras el Studio no usa Vercel Blob — el data URL se
 * guarda inline en el config del cliente en KV.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime una imagen raster a JPEG/PNG con tamaño máximo `maxDim` px.
 * SVGs pasan sin tocar. Si el archivo ya es menor a `maxBytes`, lo deja igual.
 */
export async function compressImage(
  file: File,
  options: { maxDim?: number; maxBytes?: number; quality?: number } = {},
): Promise<string> {
  const { maxDim = 1024, maxBytes = 200 * 1024, quality = 0.85 } = options;

  // SVG: pasar verbatim como data URL (no se comprime).
  if (file.type === 'image/svg+xml') {
    return readFileAsDataURL(file);
  }

  if (file.size <= maxBytes) {
    return readFileAsDataURL(file);
  }

  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);

  // Para PNG con transparencia, conservar PNG. Para JPEG, usar JPEG con quality.
  const isPng = file.type === 'image/png';
  return canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/** Devuelve un string `12 KB` o `1.5 MB` desde un número de bytes. */
export function formatBytes(n: number): string {
  if (n < 1000 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
