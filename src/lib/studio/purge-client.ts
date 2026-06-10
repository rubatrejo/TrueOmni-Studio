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
  // F-CORE-8: el del de la key directa y el scan de sub-keys son independientes
  // → en paralelo; luego los del de las sub-keys también en paralelo.
  const [, subKeys] = await Promise.all([kv.del(prefix), kv.keys(`${prefix}:*`)]);
  await Promise.all(subKeys.map((k) => kv.del(k)));
  return 1 + subKeys.length;
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
  // F-CORE-8: los prefijos son independientes entre sí → purgar en paralelo.
  // Cada uno con su propio try/catch para conservar el no-throw (un prefijo
  // que falla no aborta el resto del cleanup).
  await Promise.all(
    buildPrefixesToPurge(slug).map(async (prefix) => {
      try {
        await purgePrefix(prefix);
      } catch (err) {
        console.warn(`[purgeAllClientKeys] purgePrefix(${prefix}) failed`, err);
      }
    }),
  );
}
