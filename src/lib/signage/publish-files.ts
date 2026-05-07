import type { SignageDisplayConfig } from './schema';

/**
 * Construye el set de PublishFile[] a enviar a `publishToGitHub` para un
 * display signage (DSS7).
 *
 * **DSS7 publica solo `display.json`.** Client publish (branding +
 * tokens.css + i18n) llega en DSS7.5 si surge necesidad.
 */

export interface PublishFile {
  path: string;
  content: string;
}

export function buildSignageDisplayPublishFiles(
  clientSlug: string,
  displaySlug: string,
  display: SignageDisplayConfig,
): PublishFile[] {
  const path = `clients-signage/${clientSlug}/displays/${displaySlug}/display.json`;
  const content = `${JSON.stringify(display, null, 2)}\n`;
  return [{ path, content }];
}
