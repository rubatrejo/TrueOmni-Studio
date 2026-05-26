/**
 * Normaliza un path relativo de asset (`assets/pwa/welcome-bg.jpg`) a la URL
 * absoluta servida por el route handler `/assets/[...path]/route.ts`.
 * Si ya es absoluto (HTTP, leading slash, data: o blob:) se devuelve sin cambios.
 *
 * Helper puro (sin fs/getConfig) → apto para Client Components.
 * Genérico: úsalo en cualquier producto (kiosk, PWA…). El equivalente
 * específico de Photo Booth (`resolvePhotoBoothAsset`) precede a este y se
 * mantiene por compatibilidad; los componentes nuevos usan este.
 */
export function resolveAssetUrl(raw: string): string {
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
