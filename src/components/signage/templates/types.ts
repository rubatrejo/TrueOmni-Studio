import type { ComponentType } from 'react';

import type {
  SignageClientResolved,
  SignageDisplayConfig,
  SignageModuleKind,
  SignageSlotConfig,
} from '@/lib/signage/schema';

/**
 * Tipos públicos del catálogo de templates signage.
 *
 * Cada template `.tsx` exporta un `SignageTemplate` y se auto-registra al
 * ser importado por `registry.ts`. El runtime busca el template por id en
 * cada slide del playlist.
 */

export type SlotKind = 'fullscreen' | 'hero' | 'sidebar' | 'strip' | 'tile';

/** Posición y restricciones de un slot dentro de un template. */
export interface TemplateSlot {
  key: string;
  kind: SlotKind;
  /** Rect @ 1920×925 baseline (body region, sin header). */
  rect: { x: number; y: number; w: number; h: number };
  acceptedModules: SignageModuleKind[];
}

/** Props que recibe el `Render` de cada template. */
export interface SignageTemplateRenderProps {
  slots: SignageSlotConfig[];
  client: SignageClientResolved;
  display: SignageDisplayConfig;
}

/**
 * Definición de un template en el catálogo. Los placeholders
 * (`placeholder-a`, `placeholder-b`) tienen `slots: []` y rendering simple.
 * Templates pixel-perfect (`01-full-events` en adelante) declaran slots reales.
 */
export interface SignageTemplate {
  id: string;
  label: string;
  category: 'fullscreen' | 'composed' | 'placeholder';
  slots: TemplateSlot[];
  Render: ComponentType<SignageTemplateRenderProps>;
}
