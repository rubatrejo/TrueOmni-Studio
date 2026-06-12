import type { HomeModuleVariant, PwaListingCategory } from './config';

/**
 * Construye las tiles del grid de la PWA a partir de las SUB-CATEGORÍAS del
 * módulo del kiosk (Mexican, Italian…), con la foto compartida. La imagen de
 * cada tile sale de: `subcategoryImages[name]` (editable en Kiosk → Listings) →
 * primera imagen de un listing de esa sub-categoría → `heroImage` del módulo
 * (mismo fallback que la pantalla de sub-categorías del kiosk).
 *
 * Cada tile navega con `?cat=<nombre-sub-categoría>`, que la lista resuelve como
 * filtro directo (`listing.subcategory`).
 *
 * Devuelve `[]` si el módulo no tiene sub-categorías → el grid de la PWA cae a
 * sus `categories` propias (retrocompat).
 */
export function buildSubcategoryTiles(mod: HomeModuleVariant | undefined): PwaListingCategory[] {
  // Solo los módulos de listings traen `subcategories`/`listings`; el resto
  // (events, social-wall, map…) no aplican.
  if (!mod || !('subcategories' in mod) || !('listings' in mod)) return [];
  const subcats = (mod.subcategories ?? []).filter((n) => n && n.trim() !== '');
  if (subcats.length === 0) return [];
  const images = mod.subcategoryImages ?? {};
  const firstBySub: Record<string, string> = {};
  for (const l of mod.listings ?? []) {
    if (l.subcategory && l.image && !firstBySub[l.subcategory]) {
      firstBySub[l.subcategory] = l.image;
    }
  }
  return subcats.map((name) => ({
    key: name,
    label: name,
    image: images[name] || firstBySub[name] || mod.heroImage || '',
  }));
}
