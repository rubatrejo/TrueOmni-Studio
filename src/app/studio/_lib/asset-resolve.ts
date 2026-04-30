/**
 * Convierte un valor de imagen guardado en `KioskConfig` a una URL que el
 * navegador puede pintar dentro del Studio.
 *
 *   - data URLs y URLs absolutas (http(s)://) → se devuelven tal cual.
 *   - paths que empiezan con `/` → se asumen ya absolutos.
 *   - cualquier path relativo (ej. `assets/photo-booth/frames/...`) → se
 *     enruta vía `/api/studio/clients/<slug>/<path>` para que el server
 *     lo lea desde `clients/<slug>/<path>` en disco.
 *
 * Esto es solo para *render* dentro del Studio. El valor crudo debe seguir
 * almacenándose como path relativo en el config (publish lo escribe así
 * en disco para que el kiosk lo siga sirviendo igual).
 */
export function resolveStudioAsset(slug: string, value?: string): string | undefined {
  if (!value) return undefined;
  if (
    value.startsWith('data:') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('/')
  ) {
    return value;
  }
  return `/api/studio/clients/${encodeURIComponent(slug)}/${value}`;
}
