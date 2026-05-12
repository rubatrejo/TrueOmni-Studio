import { LayoutGrid, Monitor, Smartphone, Tablet, Tv } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Catálogo de productos del Studio. Cada cliente puede activar uno o más
 * productos desde su Vista de Cliente (`/studio/[slug]`); el branding se
 * comparte vía la layer de sync en `src/lib/studio/client-branding-sync.ts`.
 *
 * Refactor 2026-05-08: el `<ProductDropdown>` desapareció; los productos
 * ahora son cards en la vista del cliente. La jerarquía vive en la URL:
 *   `/studio/[client]/kiosk`
 *   `/studio/[client]/digital-displays`
 *   `/studio/[client]/video-walls`
 *   `/studio/[client]/mobile-pwa`     (coming soon)
 *   `/studio/[client]/tablets`        (coming soon)
 */

export type ProductStatus = 'live' | 'soon';

export interface StudioProduct {
  /** ID estable usado por manifest, URLs y active state. */
  id: 'kiosks' | 'digital-displays' | 'mobile-pwa' | 'video-walls' | 'tablets';
  /** Texto visible en cards y breadcrumbs. */
  label: string;
  /** Sub-segmento bajo `/studio/[slug]/`. */
  segment: string;
  /** Icono lucide. */
  icon: LucideIcon;
  /** `live` = página real implementada. `soon` = stub Coming Soon. */
  status: ProductStatus;
  /** Subtítulo del coming-soon (solo se usa cuando status === 'soon'). */
  comingSoonCopy?: string;
}

export const STUDIO_PRODUCTS: readonly StudioProduct[] = [
  {
    id: 'kiosks',
    label: 'Kiosks',
    segment: 'kiosk',
    icon: Monitor,
    status: 'live',
  },
  {
    id: 'digital-displays',
    label: 'Digital Displays',
    segment: 'digital-displays',
    icon: Tv,
    status: 'live',
  },
  {
    id: 'mobile-pwa',
    label: 'Mobile PWA',
    segment: 'mobile-pwa',
    icon: Smartphone,
    status: 'soon',
    comingSoonCopy:
      'Editor del Progressive Web App heredando branding del cliente. Disponible en próximas versiones.',
  },
  {
    id: 'video-walls',
    label: 'Video Walls',
    segment: 'video-walls',
    icon: LayoutGrid,
    status: 'live',
  },
  {
    id: 'tablets',
    label: 'Tablets',
    segment: 'tablets',
    icon: Tablet,
    status: 'soon',
    comingSoonCopy:
      'Editor de Tablets para experiencias touch heredando branding del cliente. Disponible en próximas versiones.',
  },
] as const;

/**
 * Devuelve el producto activo según el pathname.
 * Match por el segmento que sigue al `[slug]`:
 *   /studio/[slug]                       → null (Vista de Cliente)
 *   /studio/[slug]/kiosk                 → kiosks
 *   /studio/[slug]/digital-displays/...  → digital-displays
 *   /studio/[slug]/mobile-pwa            → mobile-pwa
 *   /studio                              → null (Clients dashboard)
 *   /studio/docs                         → null
 */
export function getActiveProduct(pathname: string): StudioProduct | null {
  const trimmed = pathname.replace(/\/+$/, '');
  const segs = trimmed.split('/').filter(Boolean);
  // `/studio/[slug]/[product]/...` → segs = ['studio', slug, product, ...]
  if (segs.length >= 3 && segs[0] === 'studio') {
    const product = segs[2]!;
    return STUDIO_PRODUCTS.find((p) => p.segment === product) ?? null;
  }
  return null;
}
