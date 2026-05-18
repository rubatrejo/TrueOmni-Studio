/**
 * Re-mapeo no-destructivo de slides entre grids de Video Walls.
 *
 * Motivación: cuando el operador cambia el grid del wall (e.g. 3x2 → 2x2),
 * los templateIds no siempre son consistentes entre grids — algunos varían
 * de nombre (`02-video-image-ad` en 3x2 vs `02-quad-mix` en 2x2 vs
 * `02-video-ad-stack` en 1x2) e incluso de intent (`03-video-image-events`
 * en 3x2 pero `03-video-image-social` en 4x2).
 *
 * Este módulo provee un mapeo por "categoría/intent" que preserva los
 * slides en lugar de borrarlos, mapeando cada slide al template equivalente
 * más cercano en el grid destino. Cuando los slotKeys coinciden entre
 * template origen y destino, también se preserva la config del slot (asset
 * URL, schedule, etc.); cuando no coinciden, se regeneran con
 * `defaultModuleFor(acceptedModules[0])`.
 */

import '@/components/video-walls/templates/load-templates';
import { getTemplate, getTemplatesForGrid } from '@/components/video-walls/templates/registry';
import type { VideoWallTemplate } from '@/components/video-walls/templates/types';
import { defaultModuleFor } from '@/lib/signage/template-catalog';

import type { GridConfig } from './dimensions';
import type { VideoWallSlide, VideoWallSlotConfig } from './schema';

/**
 * Categoría/intent del template. La derivamos del id literal (strip prefix
 * `NN-`) con dos casos especiales: `quad-mix` (2x2 / 02) y `video-ad-stack`
 * (1x2 / 02) son ambos variantes "video + ads" en grids con pocas celdas,
 * los tratamos como `video-image-ad` para el remap.
 */
export type VideoWallTemplateCategory =
  | 'video-image-full'
  | 'video-image-ad'
  | 'video-image-events'
  | 'video-image-ad-events'
  | 'video-image-social-wall'
  | 'video-image-ad-social-wall';

/**
 * Deriva la categoría del templateId. Función pura sin side effects.
 * - `02-quad-mix` (2x2) y `02-video-ad-stack` (1x2) → `video-image-ad`.
 * Antes 4x2 tenía un `03-video-image-social` (alias social) que ahora se
 * llama `03-video-image-events` (XD Slide 3 = events). El alias legacy se
 * mantiene en el lookup por compatibilidad con walls KV antiguos.
 */
export function categoryOfTemplateId(id: string): VideoWallTemplateCategory {
  const stripped = id.replace(/^\d+-/, '');
  if (stripped === 'quad-mix' || stripped === 'video-ad-stack') {
    return 'video-image-ad';
  }
  if (stripped === 'video-image-social') {
    return 'video-image-social-wall';
  }
  if (
    stripped === 'video-image-full' ||
    stripped === 'video-image-ad' ||
    stripped === 'video-image-events' ||
    stripped === 'video-image-ad-events' ||
    stripped === 'video-image-social-wall' ||
    stripped === 'video-image-ad-social-wall'
  ) {
    return stripped;
  }
  // Fallback defensivo si entra un id desconocido (e.g. catálogo futuro).
  return 'video-image-full';
}

/**
 * Tabla explícita por categoría → templateId por grid. `null` significa
 * que esa categoría no existe en ese grid y aplicará el fallback de la
 * función de matching (categoría más cercana, en último término
 * `video-image-full`).
 *
 * Orden de los fallbacks por categoría: si la equivalencia exacta no
 * existe, intentamos categorías cercanas (e.g. events sin equivalente en
 * 4x2 cae a `video-image-ad-events`; social-wall sin equivalente cae a
 * `video-image-ad-social-wall`).
 */
const TEMPLATE_EQUIVALENTS: Record<VideoWallTemplateCategory, Record<GridConfig, string | null>> = {
  'video-image-full': {
    '3x2': '01-video-image-full',
    '4x2': '01-video-image-full',
    '2x2': '01-video-image-full',
    '2x1': '01-video-image-full',
    '1x2': '01-video-image-full',
  },
  'video-image-ad': {
    '3x2': '02-video-image-ad',
    '4x2': '02-video-image-ad',
    '2x2': '02-video-image-ad', // alineado con XD Slide 2 (Big Square)
    '2x1': '02-video-image-ad',
    '1x2': '02-video-ad-stack', // variante stack vertical
  },
  'video-image-events': {
    '3x2': '03-video-image-events',
    '4x2': '03-video-image-events', // XD Slide 3: events simétrico en ambos sidebars
    '2x2': '03-video-image-events',
    '2x1': '03-video-image-events',
    '1x2': '03-video-image-events',
  },
  'video-image-ad-events': {
    '3x2': '04-video-image-ad-events',
    '4x2': '04-video-image-ad-events',
    '2x2': '04-video-image-ad-events', // XD Slide 4: events top + video+ad bot
    '2x1': null,
    '1x2': null,
  },
  'video-image-social-wall': {
    '3x2': '05-video-image-social-wall',
    '4x2': '05-video-image-social-wall',
    '2x2': '05-video-image-social-wall',
    '2x1': '04-video-image-social-wall',
    '1x2': '04-video-image-social-wall',
  },
  'video-image-ad-social-wall': {
    '3x2': '06-video-image-ad-social-wall',
    '4x2': '06-video-image-ad-social-wall',
    '2x2': '06-video-image-ad-social-wall', // XD Slide 6: ad+video col 0 + social col 1
    '2x1': '05-video-image-ad-social-wall',
    '1x2': '05-video-image-ad-social-wall',
  },
};

/**
 * Cadena de fallbacks de categoría cuando la equivalencia directa es null.
 * Si no encuentro la categoría exacta, busco la siguiente más cercana en
 * intent. Última red de seguridad: `video-image-full` (siempre existe).
 */
const CATEGORY_FALLBACK_CHAIN: Record<VideoWallTemplateCategory, VideoWallTemplateCategory[]> = {
  'video-image-full': [],
  'video-image-ad': ['video-image-full'],
  'video-image-events': ['video-image-ad-events', 'video-image-full'],
  'video-image-ad-events': ['video-image-events', 'video-image-ad', 'video-image-full'],
  'video-image-social-wall': ['video-image-ad-social-wall', 'video-image-full'],
  'video-image-ad-social-wall': ['video-image-social-wall', 'video-image-ad', 'video-image-full'],
};

/**
 * Resuelve el templateId destino para una categoría dada en el grid
 * destino. Recorre la cadena de fallbacks hasta encontrar un match.
 */
export function resolveTemplateIdForCategory(
  category: VideoWallTemplateCategory,
  nextGrid: GridConfig,
): string {
  const direct = TEMPLATE_EQUIVALENTS[category][nextGrid];
  if (direct) return direct;
  for (const fallback of CATEGORY_FALLBACK_CHAIN[category]) {
    const resolved = TEMPLATE_EQUIVALENTS[fallback][nextGrid];
    if (resolved) return resolved;
  }
  return '01-video-image-full';
}

/**
 * Re-mapea un slide al template equivalente en el nuevo grid. Estrategia
 * de preservación de slot config:
 *   1. Si el slotKey existe en ambos templates y el module es aceptado por
 *      el slot destino → preservar la config completa (asset, schedule…).
 *   2. Si solo existe el slotKey en el destino → defaultModuleFor del
 *      primer acceptedModules del nuevo slot.
 *   3. Si el module original es aceptado por algún slot del destino con
 *      el mismo acceptedModules[0] → reaprovechar por matching de tipo.
 */
export function remapSlideToGrid(
  slide: VideoWallSlide,
  nextGrid: GridConfig,
): VideoWallSlide | null {
  // 1. Si el templateId existe literal en el nuevo grid, lo mantenemos.
  let nextTemplate = getTemplate(slide.templateId, nextGrid);
  let nextTemplateId = slide.templateId;

  if (!nextTemplate) {
    const category = categoryOfTemplateId(slide.templateId);
    nextTemplateId = resolveTemplateIdForCategory(category, nextGrid);
    nextTemplate = getTemplate(nextTemplateId, nextGrid);
  }

  if (!nextTemplate) {
    // Sanidad: el `01-video-image-full` siempre debería existir. Si fallamos
    // hasta aquí, descartamos el slide.
    return null;
  }

  const nextSlots = buildSlotConfigsForTemplate(slide.slots, nextTemplate);

  return {
    ...slide,
    templateId: nextTemplateId,
    slots: nextSlots,
  };
}

/**
 * Construye los slots del slide destino reusando configs origen cuando el
 * slotKey existe en ambos templates y el module es aceptado, o reusando
 * por matching de tipo (acceptedModules) si los slotKeys no coinciden.
 */
function buildSlotConfigsForTemplate(
  originSlots: VideoWallSlotConfig[],
  template: VideoWallTemplate,
): VideoWallSlotConfig[] {
  const used = new Set<string>();
  return template.slots.map((slot) => {
    const accepted = slot.acceptedModules;

    // 1. Match por slotKey + module aceptado.
    const byKey = originSlots.find(
      (s) => s.slotKey === slot.key && accepted.includes(s.module.kind),
    );
    if (byKey && !used.has(`key:${byKey.slotKey}`)) {
      used.add(`key:${byKey.slotKey}`);
      return { slotKey: slot.key, module: byKey.module };
    }

    // 2. Match por tipo de module (primer slot del origen con kind aceptado
    //    que no haya sido consumido por una iteración previa).
    const byType = originSlots.find(
      (s) => accepted.includes(s.module.kind) && !used.has(`type:${s.slotKey}:${s.module.kind}`),
    );
    if (byType) {
      used.add(`type:${byType.slotKey}:${byType.module.kind}`);
      return { slotKey: slot.key, module: byType.module };
    }

    // 3. Default fresh.
    return {
      slotKey: slot.key,
      module: defaultModuleFor(accepted[0] ?? 'video-image'),
    };
  });
}

/**
 * Re-mapea una playlist completa al nuevo grid. Descarta slides que no
 * tienen equivalente válido (raro — siempre debería caer al template
 * `01-video-image-full`).
 */
export function remapPlaylistToGrid(
  slides: VideoWallSlide[],
  nextGrid: GridConfig,
): VideoWallSlide[] {
  const out: VideoWallSlide[] = [];
  for (const s of slides) {
    const remapped = remapSlideToGrid(s, nextGrid);
    if (remapped) out.push(remapped);
  }
  return out;
}

/**
 * Cuenta cuántos slides cambiaron de `templateId` al remapear. Útil para
 * mostrar feedback al operador (toast/console) sin bloquear la operación.
 */
export function countRemappedTemplates(before: VideoWallSlide[], after: VideoWallSlide[]): number {
  let n = 0;
  for (let i = 0; i < Math.min(before.length, after.length); i++) {
    if (before[i].templateId !== after[i].templateId) n++;
  }
  return n;
}

/**
 * Helper de tests / debugging — devuelve todos los templates registrados
 * para un grid. Re-export por conveniencia.
 */
export { getTemplatesForGrid };
