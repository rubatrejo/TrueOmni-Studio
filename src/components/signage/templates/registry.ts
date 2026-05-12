import type { SignageOrientation } from '@/lib/signage/schema';

import type { SignageTemplate } from './types';

/**
 * Registry singleton de templates signage. API pura — sin side effects.
 *
 * Cada template `.tsx` declara su `orientation` y se auto-registra al ser
 * importado por `load-templates.ts`. La clave interna del Map combina id +
 * orientation: un mismo `01-full-events` tiene variantes landscape +
 * portrait que viven en archivos distintos.
 */

const REGISTRY = new Map<string, SignageTemplate>();

function keyOf(id: string, orientation: SignageOrientation): string {
  return `${id}__${orientation}`;
}

export function registerTemplate(template: SignageTemplate): void {
  REGISTRY.set(keyOf(template.id, template.orientation), template);
}

/**
 * Resuelve un template por (id, orientation). Fallback a landscape si la
 * variante portrait pedida no existe — preserva back-compat para slides
 * existentes cuyo `templateId` solo está registrado en landscape.
 */
export function getTemplate(
  id: string,
  orientation: SignageOrientation = 'landscape',
): SignageTemplate | undefined {
  const exact = REGISTRY.get(keyOf(id, orientation));
  if (exact) return exact;
  if (orientation !== 'landscape') {
    return REGISTRY.get(keyOf(id, 'landscape'));
  }
  return undefined;
}

export function getAllTemplates(): SignageTemplate[] {
  return Array.from(REGISTRY.values());
}

/**
 * Lista templates registrados para una orientation concreta. La UI del
 * editor lo usa para mostrar solo las opciones aplicables al display
 * actual.
 */
export function getTemplatesForOrientation(orientation: SignageOrientation): SignageTemplate[] {
  return getAllTemplates().filter((t) => t.orientation === orientation);
}
