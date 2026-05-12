import type { ComponentType } from 'react';

import type { CellRect, GridConfig } from '@/lib/video-walls/dimensions';
import type {
  VideoWallClientResolved,
  VideoWallConfig,
  VideoWallModuleKind,
  VideoWallSlotConfig,
} from '@/lib/video-walls/schema';

/**
 * Tipos del registry de templates video-walls.
 *
 * Diferencia clave vs signage: `TemplateSlot.cellRect` ancla en celdas
 * (row/col/rowSpan/colSpan) en lugar de píxeles absolutos. El runtime
 * resuelve a píxeles on-the-fly con `cellRectToPx()`.
 */

export type VideoWallSlotKind = 'fullscreen' | 'hero' | 'sidebar' | 'strip' | 'tile';

export interface VideoWallTemplateSlot {
  /** Identificador estable usado por SlideRowExpanded y el Render del template. */
  key: string;
  kind: VideoWallSlotKind;
  cellRect: CellRect;
  acceptedModules: VideoWallModuleKind[];
}

export interface VideoWallTemplateRenderProps {
  client: VideoWallClientResolved;
  wall: VideoWallConfig;
  slots: VideoWallSlotConfig[];
}

export interface VideoWallTemplate {
  id: string;
  label: string;
  category: 'fullscreen' | 'composed' | 'placeholder';
  /** Grid en la que está registrado. Un mismo id puede existir en
   *  múltiples grids con `Render` adaptado a cada layout. */
  grid: GridConfig;
  slots: VideoWallTemplateSlot[];
  Render: ComponentType<VideoWallTemplateRenderProps>;
}
