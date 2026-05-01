import { LayoutTemplate, Monitor, Package, Presentation } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Catálogo de productos del Studio. Renderizado por el `<ProductDropdown>`
 * al lado del logo "TrueOmni Studio" en el header. Por ahora solo `kiosks`
 * es funcional; las demás categorías muestran "Coming soon".
 */

export type ProductStatus = 'live' | 'soon';

export interface StudioProduct {
  /** ID estable usado por el active state. */
  id: string;
  /** Texto visible en el botón del dropdown y en el hero de la page. */
  label: string;
  /** Ruta absoluta. `usePathname()` la matchea por prefijo. */
  href: string;
  /** Icono lucide a 14px en el dropdown y a 44px en la coming-soon page. */
  icon: LucideIcon;
  /** `live` = página real implementada. `soon` = placeholder. */
  status: ProductStatus;
  /** Subtítulo del coming-soon (solo se usa cuando status === 'soon'). */
  comingSoonCopy?: string;
}

export const STUDIO_PRODUCTS: readonly StudioProduct[] = [
  {
    id: 'kiosks',
    label: 'Kiosks',
    href: '/studio',
    icon: Monitor,
    status: 'live',
  },
  {
    id: 'champion-decks',
    label: 'Champion Decks',
    href: '/studio/champion-decks',
    icon: Presentation,
    status: 'soon',
    comingSoonCopy:
      'Build interactive sales decks for retail champions — drag-and-drop slides, live data widgets, branded exports.',
  },
  {
    id: 'hardware-wraps',
    label: 'Hardware Wraps',
    href: '/studio/hardware-wraps',
    icon: Package,
    status: 'soon',
    comingSoonCopy:
      'Design vinyl wraps for kiosk enclosures, totems and walls — preview them on real device renders before printing.',
  },
  {
    id: 'landing-pages',
    label: 'Landing Pages',
    href: '/studio/landing-pages',
    icon: LayoutTemplate,
    status: 'soon',
    comingSoonCopy:
      'Generate marketing landing pages from the same brand tokens as your kiosks. Publish to a TrueOmni subdomain in one click.',
  },
] as const;

/**
 * Devuelve el producto activo según el pathname. Match por prefijo: la
 * home `/studio` se queda en `kiosks` aunque entres a `/studio/{slug}`.
 *
 * Casos:
 *  - `/studio`                       → kiosks
 *  - `/studio/{slug}`                → kiosks (sigue siendo el editor)
 *  - `/studio/champion-decks`        → champion-decks
 *  - `/studio/champion-decks/foo`    → champion-decks
 *  - `/studio/docs`                  → kiosks (docs es feature transversal)
 */
export function getActiveProduct(pathname: string): StudioProduct {
  const reserved = new Set(['docs']);
  const trimmed = pathname.replace(/\/+$/, '');
  const segs = trimmed.split('/').filter(Boolean);

  if (segs.length >= 2 && segs[0] === 'studio') {
    const second = segs[1]!;
    if (!reserved.has(second)) {
      const direct = STUDIO_PRODUCTS.find((p) => p.id === second);
      if (direct) return direct;
    }
  }
  // `/studio`, `/studio/{slug}`, `/studio/docs` → Kiosks por default.
  return STUDIO_PRODUCTS[0]!;
}
