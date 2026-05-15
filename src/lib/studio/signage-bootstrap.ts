import 'server-only';

import { loadSignageClient, loadSignageDisplay } from '@/lib/signage/config';
import {
  kvSignageDisplay,
  kvSignageEvents,
  kvSignageNews,
  kvSignageSocial,
} from '@/lib/signage/kv-store';
import type { SignageClientFile } from '@/lib/signage/schema';

/**
 * Clona el contenido del Digital Display template (`default`) al cliente
 * recién creado: displays declarados + events/social/news + cada display
 * file con sus playlists. Devuelve la lista de display slugs preservada
 * para que el caller la asigne al `SignageClientFile.displays`.
 *
 * Sin esto, un cliente con DD activo arrancaba con `displays: []` y
 * events/social/news vacíos — el operador veía el editor "limpio" en
 * lugar del template TrueOmni que esperaba clonar.
 *
 * Idempotente: re-llamarlo solo sobreescribe el KV del cliente nuevo,
 * nunca toca el template. Si el template no existe o no declara displays,
 * devuelve `[]` sin fallar para mantener el flow de creación.
 */
export async function cloneSignageContentFromTemplate(targetSlug: string): Promise<string[]> {
  const TEMPLATE_SLUG = 'default';
  const template = await loadSignageClient(TEMPLATE_SLUG);
  if (!template) return [];

  // 1. Events / Social / News al KV del cliente nuevo.
  if (template.events && template.events.length > 0) {
    await kvSignageEvents.set(targetSlug, template.events);
  }
  if (template.social && template.social.posts.length > 0) {
    await kvSignageSocial.set(targetSlug, template.social);
  }
  if (template.news) {
    await kvSignageNews.set(targetSlug, template.news);
  }

  // 2. Cada display declarado en el template → KV del cliente nuevo.
  const displaySlugs: string[] = Array.isArray(template.displays) ? [...template.displays] : [];
  for (const displaySlug of displaySlugs) {
    const display = await loadSignageDisplay(TEMPLATE_SLUG, displaySlug);
    if (display) {
      await kvSignageDisplay.set(targetSlug, displaySlug, display);
    }
  }

  return displaySlugs;
}

/**
 * Aplica los display slugs clonados al objeto `SignageClientFile`. Encapsula
 * el patrón "preserva displays del template" para que el caller no tenga
 * que recordar mutar `clone.displays`.
 */
export function applyClonedDisplays(clone: SignageClientFile, displaySlugs: string[]): void {
  clone.displays = [...displaySlugs];
}
