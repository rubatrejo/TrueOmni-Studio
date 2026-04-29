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

// Helper puro `resolvePhotoBoothAsset` movido a `photo-booth-asset.ts`
// para que pueda ser consumido desde client components sin disparar el
// guard de `server-only`.
