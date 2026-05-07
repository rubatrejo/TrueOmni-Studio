import type { SignageTemplate } from './types';

/**
 * Registry singleton de templates signage. API pura — sin side effects.
 *
 * El auto-registro de los templates conocidos vive en `load-templates.ts`
 * (importado por el player) para evitar dependencia circular ESM.
 */

const REGISTRY = new Map<string, SignageTemplate>();

export function registerTemplate(template: SignageTemplate): void {
  REGISTRY.set(template.id, template);
}

export function getTemplate(id: string): SignageTemplate | undefined {
  return REGISTRY.get(id);
}

export function getAllTemplates(): SignageTemplate[] {
  return Array.from(REGISTRY.values());
}
