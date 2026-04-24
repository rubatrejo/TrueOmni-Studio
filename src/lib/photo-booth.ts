import 'server-only';

import { getConfig, type PhotoBoothConfig } from './config';

/**
 * Devuelve el bloque `features.home.photoBooth` del cliente activo, o `null`
 * si no está configurado o está deshabilitado. Server-only.
 */
export async function getPhotoBoothConfig(): Promise<PhotoBoothConfig | null> {
  const config = await getConfig();
  const photoBooth = config.features?.home?.photoBooth;
  if (!photoBooth || !photoBooth.enabled) return null;
  return photoBooth;
}

/**
 * Normaliza un path relativo de asset (`assets/photo-booth/frames/frame-0.png`)
 * a la URL absoluta servida por el route handler `/assets/[...path]/route.ts`.
 * Si el path ya es absoluto (HTTP o leading slash) se devuelve sin cambios.
 *
 * Mismo patrón que `resolveAiAssetPath`.
 */
export function resolvePhotoBoothAsset(raw: string): string {
  if (raw.startsWith('http') || raw.startsWith('/')) return raw;
  return `/${raw}`;
}
