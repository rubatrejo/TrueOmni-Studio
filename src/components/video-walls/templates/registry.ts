import type { GridConfig } from '@/lib/video-walls/dimensions';

import type { VideoWallTemplate } from './types';

/**
 * Registry singleton de templates video-walls. Cada template se
 * auto-registra al ser importado por `load-templates.ts`. La clave
 * interna del Map combina id + grid: un mismo `01-video-image-full`
 * tiene variantes 3×2 / 4×2 / 2×2 / 2×1 / 1×2 que viven en archivos
 * distintos (`templates/<grid>/<id>.tsx`).
 */

const REGISTRY = new Map<string, VideoWallTemplate>();

function keyOf(id: string, grid: GridConfig): string {
  return `${id}__${grid}`;
}

export function registerTemplate(template: VideoWallTemplate): void {
  REGISTRY.set(keyOf(template.id, template.grid), template);
}

export function getTemplate(id: string, grid: GridConfig): VideoWallTemplate | undefined {
  return REGISTRY.get(keyOf(id, grid));
}

export function getAllTemplates(): VideoWallTemplate[] {
  return Array.from(REGISTRY.values());
}

export function getTemplatesForGrid(grid: GridConfig): VideoWallTemplate[] {
  return Array.from(REGISTRY.values()).filter((t) => t.grid === grid);
}
