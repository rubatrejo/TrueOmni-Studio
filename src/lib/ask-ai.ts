import 'server-only';

import { getConfig, type AskAiConfig } from './config';

/**
 * Devuelve el bloque `features.home.askAi` del cliente activo, o `null` si
 * no está configurado o está deshabilitado. Server-only.
 */
export async function getAskAiConfig(): Promise<AskAiConfig | null> {
  const config = await getConfig();
  const askAi = config.features?.home?.askAi;
  if (!askAi || !askAi.enabled) return null;
  return askAi;
}

/**
 * Normaliza un path relativo de asset (`assets/ai/avatar.png`) a la URL
 * absoluta servida por el route handler `/assets/[...path]/route.ts`. Si el
 * path ya es absoluto (HTTP o leading slash), se devuelve sin cambios.
 *
 * Mismo patrón que `resolveAssetPath` de `deal-redeem-modal.tsx`.
 */
export function resolveAiAssetPath(raw: string): string {
  if (raw.startsWith('http') || raw.startsWith('/')) return raw;
  return `/${raw}`;
}
