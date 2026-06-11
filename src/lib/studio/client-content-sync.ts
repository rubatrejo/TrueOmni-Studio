import 'server-only';

import { ClientContentSchema, emptyClientContent } from './client-content';
import type { ClientContent } from './client-content';
import { clientKeys } from './client-manifest';
import { kv } from './kv';

/**
 * Persistencia del **contenido a nivel cliente** (`client:{slug}:content`).
 *
 * Source of truth de los listings/events ingeridos de feeds. La propagación a
 * los productos (cfg/pwa/signage) vive en este mismo módulo (Fase 6); aquí, de
 * momento, el CRUD del documento con control de versión optimista.
 *
 * El schema y los helpers puros están en `client-content.ts` (no server-only)
 * para que los reusen la UI del Studio y los tests.
 */

// ---------------------------------------------------------------------------
//  KV CRUD
// ---------------------------------------------------------------------------

/** Carga el contenido del cliente. Null si nunca se ha inicializado. */
export async function loadClientContent(slug: string): Promise<ClientContent | null> {
  const raw = await kv.get<unknown>(clientKeys.content(slug));
  if (!raw) return null;
  const parsed = ClientContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Carga el contenido del cliente, o un documento vacío si no existe. */
export async function loadClientContentOrEmpty(slug: string): Promise<ClientContent> {
  return (await loadClientContent(slug)) ?? emptyClientContent();
}

/** Escribe el contenido tal cual (sin tocar la versión). Uso interno. */
export async function saveClientContentRaw(slug: string, content: ClientContent): Promise<void> {
  await kv.set(clientKeys.content(slug), content);
}

export interface SaveContentResult {
  ok: boolean;
  /** Conflicto de versión: el cliente envió un `ifVersion` desfasado. */
  conflict?: boolean;
  /** Versión persistida tras el save (currentVersion + 1). */
  version?: number;
  /** Versión actual en KV cuando hubo conflicto. */
  currentVersion?: number;
}

/**
 * Guarda el contenido con **optimistic concurrency**. Si `ifVersion` se pasa y
 * no coincide con el `currentVersion` en KV, devuelve `conflict: true` sin
 * escribir (mismo patrón que el PATCH de configs del kiosk). En caso de éxito
 * incrementa `currentVersion` y devuelve la nueva versión.
 *
 * Nota: el KV no expone CAS/Lua, así que queda una ventana get→set de
 * microsegundos, despreciable para la concurrencia real del Studio.
 */
export async function saveClientContent(
  slug: string,
  content: ClientContent,
  ifVersion?: number,
): Promise<SaveContentResult> {
  const existing = await loadClientContent(slug);
  const currentVersion = existing?.currentVersion ?? 0;

  if (ifVersion != null && ifVersion !== currentVersion) {
    return { ok: false, conflict: true, currentVersion };
  }

  const nextVersion = currentVersion + 1;
  const next: ClientContent = { ...content, currentVersion: nextVersion };
  await saveClientContentRaw(slug, next);
  return { ok: true, version: nextVersion };
}
