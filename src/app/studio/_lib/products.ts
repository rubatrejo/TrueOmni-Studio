import {
  LayoutGrid,
  LayoutTemplate,
  Monitor,
  Package,
  Presentation,
  Tv,
} from 'lucide-react';
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
  /** 3 bullets describiendo el value prop específico (audit F-45 — los
   *  coming-soon eran demasiado genéricos). Solo aplica si status='soon'. */
  comingSoonFeatures?: readonly string[];
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
    comingSoonFeatures: [
      'Slides with live KPI widgets that pull from your actual sales data',
      'Brand tokens shared with your kiosks — change colors once, update everywhere',
      'Export to PDF, Keynote or share a private URL with one click',
    ],
  },
  {
    id: 'hardware-wraps',
    label: 'Hardware Wraps',
    href: '/studio/hardware-wraps',
    icon: Package,
    status: 'soon',
    comingSoonCopy:
      'Design vinyl wraps for kiosk enclosures, totems and walls — preview them on real device renders before printing.',
    comingSoonFeatures: [
      'Real-device 3D mockups for the most common kiosk enclosures (Pyramid, Slab, Pedestal)',
      'Drag artwork onto each face with bleed marks, safe areas and cut paths baked in',
      'Print-ready PDF/AI export with ICC profile and dimensions per panel',
    ],
  },
  {
    id: 'landing-pages',
    label: 'Landing Pages',
    href: '/studio/landing-pages',
    icon: LayoutTemplate,
    status: 'soon',
    comingSoonCopy:
      'Generate marketing landing pages from the same brand tokens as your kiosks. Publish to a TrueOmni subdomain in one click.',
    comingSoonFeatures: [
      'Section-based builder (Hero / Features / CTA) that inherits brand tokens automatically',
      'Mobile-first responsive — every section ships with a tested mobile/tablet/desktop variant',
      'Publish to {your-slug}.kiosks.trueomni.com with HTTPS and analytics out of the box',
    ],
  },
  {
    id: 'digital-displays',
    label: 'Digital Displays',
    href: '/studio/digital-displays',
    icon: Tv,
    status: 'soon',
    comingSoonCopy:
      'Run scheduled content loops on lobby TVs, conference room screens and digital signage — same brand tokens, made for ambient playback.',
    comingSoonFeatures: [
      'Playlist editor with timed slides, video loops and live data tickers',
      'Day-parting: show different content by hour, day of the week or special events',
      'Push to any HDMI display via TrueOmni Player (Raspberry Pi, BrightSign, Chromecast)',
    ],
  },
  {
    id: 'video-walls',
    label: 'Video Walls',
    href: '/studio/video-walls',
    icon: LayoutGrid,
    status: 'soon',
    comingSoonCopy:
      'Compose synchronized content across a grid of displays. Layout-aware editing so a hero asset can span multiple screens or stay per-tile.',
    comingSoonFeatures: [
      'Grid composer (2×2, 3×3, custom) with snapping and bezel-aware safe areas',
      'Per-tile or spanning content with frame-accurate sync between players',
      'Stress-test renderer to preview how a video wall behaves before installing it on-site',
    ],
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
