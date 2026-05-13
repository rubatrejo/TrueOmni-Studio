import 'server-only';

/**
 * Validación de slugs (cliente + wall) para los endpoints HTTP del producto
 * Video Walls.
 *
 * Next ya bloquea segmentos con `..` por convención del router, pero permite
 * caracteres exóticos (`%`, `:`, `/` URL-encoded, unicode raro) que terminan
 * concatenándose a keys KV (`videowall:client:<slug>` etc.) y pueden corromper
 * el namespace o saltar la separación lógica entre clientes.
 *
 * Mantén este regex idéntico al usado en la creación de walls
 * (`/api/studio/video-walls/walls/[client]/route.ts` POST) — kebab-case
 * minúsculas, comienza y termina en alfanumérico, máximo 64 chars.
 */
export const VW_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

export function isValidVwSlug(s: string): boolean {
  return typeof s === 'string' && VW_SLUG_REGEX.test(s);
}

/**
 * Lanza un Error si `s` no es un slug VW válido. El handler que lo invoca
 * debe atrapar el error y mapearlo a un 400 con el mismo shape que el resto
 * de errores de validación (`{ error: 'invalid slug' }`). Ver helper
 * `vwSlugErrorResponse` para una respuesta consistente.
 */
export function assertVwSlug(s: string, name: string): void {
  if (!isValidVwSlug(s)) {
    throw new VwSlugError(`invalid ${name} slug`);
  }
}

export class VwSlugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VwSlugError';
  }
}
