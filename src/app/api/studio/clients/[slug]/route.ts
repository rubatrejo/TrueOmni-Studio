import { NextResponse } from 'next/server';

import { removeClientFromList } from '@/lib/studio/client-manifest';
import { kv } from '@/lib/studio/kv';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ slug: string }> };

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;
const PROTECTED_SLUGS = new Set(['default']);

/**
 * Prefijos KV bajo los que viven todos los datos de un cliente unified
 * (kiosk + signage + video walls + manifest). Cada uno puede ser una key
 * directa (`<prefix>`) o tener sub-keys (`<prefix>:...`). El purge borra
 * ambos casos.
 *
 * Mantener sincronizado con:
 *  - `@/lib/studio/kv` (kvKeys.cfg / cfgMeta / cfgVersion / cfgSnap / ...).
 *  - `@/lib/signage/kv-keys` (kSignageClient / kSignageDisplay / ...).
 *  - `@/lib/video-walls/kv-keys` (kVideoWallClient / kVideoWall / ...).
 *  - `@/lib/studio/client-manifest` (clientKeys.manifest / branding / ...).
 */
function buildPrefixesToPurge(slug: string): string[] {
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
    // Unified manifest + unified branding + sync-errors + migrating lock
    `client:${slug}`,
  ];
}

async function purgePrefix(prefix: string): Promise<number> {
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
 * `DELETE /api/studio/clients/[slug]` — purga un cliente unified completo
 * (kiosk + signage + video walls + manifest + unified branding + entries
 * en todas las listas). Reemplaza el legacy `DELETE /api/studio/configs/[slug]`
 * que solo desactivaba el producto kiosk y dejaba el manifest vivo si el
 * cliente tenía signage / walls activos — desde el dashboard `/studio` el
 * usuario espera "delete client" semánticamente, no "delete kiosk product".
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const { slug } = await params;

  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }
  if (PROTECTED_SLUGS.has(slug)) {
    return NextResponse.json({ error: `Cannot delete protected slug "${slug}"` }, { status: 403 });
  }

  try {
    // 1. Purga atómica por prefijos.
    for (const prefix of buildPrefixesToPurge(slug)) {
      try {
        await purgePrefix(prefix);
      } catch (err) {
        // No bloquear el resto del cleanup si un namespace falla — el
        // dashboard puede tener stale entries, mejor que dejar el cliente
        // a medias.
        console.warn(`[api/studio/clients/[slug] DELETE] purgePrefix(${prefix}) failed`, err);
      }
    }

    // 2. Limpia membership en SETs (kiosk + signage + video walls).
    try {
      await kv.srem('clients:list', slug);
    } catch (err) {
      console.warn('[api/studio/clients/[slug] DELETE] srem clients:list failed', err);
    }
    try {
      await kv.srem('signage:clientList', slug);
    } catch (err) {
      console.warn('[api/studio/clients/[slug] DELETE] srem signage:clientList failed', err);
    }
    try {
      await kv.srem('videowall:clientList', slug);
    } catch (err) {
      console.warn('[api/studio/clients/[slug] DELETE] srem videowall:clientList failed', err);
    }

    // 3. Quita del array unified `client:list` (no es SET).
    try {
      await removeClientFromList(slug, 'studio-delete');
    } catch (err) {
      console.warn('[api/studio/clients/[slug] DELETE] removeClientFromList failed', err);
    }

    // 4. Invalida el cache de auto-migración para que el dashboard refleje
    //    el delete inmediatamente sin esperar TTL.
    try {
      const { invalidateAutoMigrateCache } = await import('@/lib/studio/auto-migrate-clients');
      invalidateAutoMigrateCache();
    } catch {
      /* noop */
    }

    return NextResponse.json({ slug, deleted: true });
  } catch (error) {
    console.error('[api/studio/clients/[slug] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
