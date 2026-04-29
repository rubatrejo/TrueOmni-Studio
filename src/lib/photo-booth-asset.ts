/**
 * Normaliza un path relativo de asset (`assets/photo-booth/frames/frame-0.png`)
 * a la URL absoluta servida por el route handler `/assets/[...path]/route.ts`.
 * Si el path ya es absoluto (HTTP o leading slash) se devuelve sin cambios.
 *
 * Helper puro: sin acceso a fs/getConfig — apto para client components.
 */
export function resolvePhotoBoothAsset(raw: string): string {
  if (
    raw.startsWith('http') ||
    raw.startsWith('/') ||
    raw.startsWith('data:') ||
    raw.startsWith('blob:')
  ) {
    return raw;
  }
  return `/${raw}`;
}
