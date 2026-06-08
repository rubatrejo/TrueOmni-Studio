import 'server-only';

import { kv } from './kv';

/**
 * Prefijos KV bajo los que viven todos los datos de un cliente unified
 * (kiosk + signage + video walls + mobile PWA + manifest). Cada uno puede ser
 * una key directa (`<prefix>`) o tener sub-keys (`<prefix>:...`). El purge borra
 * ambos casos.
 *
 * Mantener sincronizado con:
 *  - `@/lib/studio/kv` (kvKeys.cfg / cfgMeta / cfgVersion / cfgSnap / pwa / ...).
 *  - `@/lib/signage/kv-keys` (kSignageClient / kSignageDisplay / ...).
 *  - `@/lib/video-walls/kv-keys` (kVideoWallClient / kVideoWall / ...).
 *  - `@/lib/studio/pwa-config` (kvKeys.pwa / pwaMeta / pwaSnap / pwaSnapList).
 *  - `@/lib/studio/client-manifest` (clientKeys.manifest / branding / ...).
 */
export function buildPrefixesToPurge(slug: string): string[] {
  return [
    // Kiosk
    `cfg:${slug}`,
    `i18n:${slug}`,
    `pub:${slug}`,
    `changelog:${slug}`,
    // Signage
    `signage:client:${slug}`,
    `signage:display:${slug}`,
    `signage:displayRaw:${slug}`,
    `signage:displaySnap:${slug}`,
    `signage:displaySnapList:${slug}`,
    `signage:themeSnap:${slug}`,
    `signage:themeSnapList:${slug}`,
    `signage:events:${slug}`,
    `signage:social:${slug}`,
    `signage:news:${slug}`,
    `signage:i18n:${slug}`,
    // Video walls
    `videowall:client:${slug}`,
    `videowall:wall:${slug}`,
    `videowall:wallRaw:${slug}`,
    `videowall:cfgSnap:${slug}`,
    `videowall:cfgSnapList:${slug}`,
    `videowall:themeSnap:${slug}`,
    `videowall:themeSnapList:${slug}`,
    `videowall:events:${slug}`,
    `videowall:social:${slug}`,
    `videowall:news:${slug}`,
    `videowall:i18n:${slug}`,
    // Mobile PWA — `pwa:${slug}` cubre la working copy; sus sub-keys
    // (`:meta`, `:snap:<ts>`, `:snap-list`) las borra `purgePrefix` por patrón.
    `pwa:${slug}`,
    // Unified manifest + unified branding + sync-errors + migrating lock
    `client:${slug}`,
  ];
}

export async function purgePrefix(prefix: string): Promise<number> {
  let removed = 0;
  // Direct key.
  await kv.del(prefix);
  removed += 1;
  // Sub-keys con separador `:`.
  const subKeys = await kv.keys(`${prefix}:*`);
  for (const k of subKeys) {
    await kv.del(k);
    removed += 1;
  }
  return removed;
}

/**
 * Purga atómica de TODOS los namespaces KV de un cliente. Llamado por:
 *  - DELETE /api/studio/clients/[slug] (delete cascade).
 *  - POST /api/studio/clients (orphan recovery cuando un slug tiene
 *    legacy keys sin manifest).
 *
 * No-throws: errores por prefijo se loguean pero no abortan el resto del
 * cleanup. Mejor un cliente a medias purgado que dejar 80% de keys vivas.
 */
export async function purgeAllClientKeys(slug: string): Promise<void> {
  for (const prefix of buildPrefixesToPurge(slug)) {
    try {
      await purgePrefix(prefix);
    } catch (err) {
      console.warn(`[purgeAllClientKeys] purgePrefix(${prefix}) failed`, err);
    }
  }
}
