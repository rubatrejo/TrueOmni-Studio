'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import { useModuleHeroBridge } from '@/components/home/use-module-hero-bridge';
import { useModuleLabel } from '@/components/i18n-provider';
import { getCachedListings } from '@/components/studio-bridge';
import type { HomeListing, HomeModule, Listing } from '@/lib/config';

import { FloatingHomeButton } from './floating-home-button';
import { ListingsToolbar } from './listings-toolbar';

/**
 * Pantalla de SUB-CATEGORÍAS del kiosk (1080×1920). Al entrar a un módulo de
 * listings con sub-categorías, se muestra esta rejilla de tiles (foto + nombre
 * centrado) antes de la lista — equivalente al grid de la PWA, adaptado al
 * retrato.
 *
 * Layout (igual que `ListingsModule`, para consistencia con la lista):
 *   - `header` (HomeHeader server-rendered): hero + logo + clock + weather.
 *   - `ListingsToolbar` y=620..738: label del módulo + search/sort/filter.
 *   - Grid de tiles scrolleable.
 *
 * Cada tile navega a `/home/<module>?cat=<nombre>` → la page renderiza
 * `ListingsModule` pre-filtrado por esa sub-categoría. La foto sale de
 * `module.subcategoryImages[name]` (editable en el Studio); si falta, cae al
 * `heroImage` del módulo. Los nombres son CONTENT (del config), no chrome.
 *
 * La toolbar es la MISMA barra que la lista (consistencia con PWA): `search`
 * abre el SearchOverlay; `sort`/`filter` llevan a la lista completa, donde esos
 * controles tienen efecto.
 */
export function SubcategoryScreen({
  moduleKey,
  module: mod,
  header,
}: {
  moduleKey: string;
  module: HomeModule;
  /** Hero + header server-rendered (pasado por la page), igual que ListingsModule. */
  header: ReactNode;
}) {
  const router = useRouter();

  // Live preview override del Studio (mismo canal que `ListingsModule`). La page
  // default `/home/<module>` con sub-categorías monta ESTA pantalla (no
  // `ListingsModule`), así que sin esto el `kiosk:listings-override` —y por tanto
  // el hero del módulo— no se reflejaba aquí. Buscamos la entry por `moduleKey`.
  const [override, setOverride] = useState<HomeModule | null>(null);
  const effective: HomeModule = override ?? mod;
  useEffect(() => {
    const apply = (detail: unknown) => {
      if (!Array.isArray(detail)) return;
      const entry = detail.find(
        (en): en is ListingsEntryPatch =>
          !!en && typeof en === 'object' && (en as ListingsEntryPatch).key === moduleKey,
      );
      const sub = entry?.catalog;
      if (!entry || !sub) return;
      setOverride({
        kind: 'listings',
        label: entry.label ?? mod.label,
        heroImage: sub.heroImage ?? mod.heroImage,
        subcategories: sub.subcategories ?? mod.subcategories,
        subcategoryImages: mod.subcategoryImages,
        features: sub.features ?? mod.features,
        listings: (sub.listings ?? mod.listings) as Listing[],
      });
    };
    // Hidrata desde el cache del bridge (edita→navega). No-op en runtime real.
    apply(getCachedListings());
    const handler = (e: Event) => apply((e as CustomEvent<unknown>).detail);
    window.addEventListener('kiosk:listings-override', handler);
    return () => window.removeEventListener('kiosk:listings-override', handler);
  }, [
    moduleKey,
    mod.label,
    mod.heroImage,
    mod.subcategories,
    mod.subcategoryImages,
    mod.features,
    mod.listings,
  ]);

  // Empuja el hero efectivo del módulo al HomeHeader (preview live del Studio),
  // igual que `ListingsModule`. Sin esto el `<HomeHeader>` (Server Component)
  // de esta pantalla nunca recibía el hero del override.
  useModuleHeroBridge(effective.heroImage);

  const moduleLabel = useModuleLabel(moduleKey, effective.label);
  const [searchOpen, setSearchOpen] = useState(false);

  const images = effective.subcategoryImages ?? {};
  const tiles = effective.subcategories.filter((name) => name && name.trim() !== '');

  // Fallback de foto por sub-categoría: la imagen del primer listing que
  // pertenece a esa sub-categoría. Así cada tile muestra una foto real y
  // distinta aunque el operador no haya subido una en el Studio (consistente
  // con la PWA). `subcategoryImages` (editable) siempre gana.
  const firstImageBySubcat = useMemo(() => {
    const byName: Record<string, string> = {};
    for (const l of effective.listings) {
      if (l.subcategory && l.image && !byName[l.subcategory]) {
        byName[l.subcategory] = l.image;
      }
    }
    return byName;
  }, [effective.listings]);

  // Mapeo Listing → HomeListing para el SearchOverlay (igual que ListingsModule).
  const searchListings: HomeListing[] = useMemo(
    () =>
      effective.listings.map((l) => ({
        slug: l.slug,
        title: l.title,
        category: moduleKey,
        image: l.image,
      })),
    [effective.listings, moduleKey],
  );

  // Sort/Filter no operan sobre tiles → llevan a la lista completa del módulo.
  const goToFullList = () => router.push(`/home/${moduleKey}?cat=all`);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {/* Hero + header universal */}
      {header}

      {/* Toolbar (misma barra que la lista) */}
      <ListingsToolbar
        label={moduleLabel}
        onSearch={() => setSearchOpen(true)}
        onSort={goToFullList}
        onFilter={goToFullList}
      />

      {/* Grid de tiles scrolleable */}
      <main className="scrollbar-hide relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <div
          className="grid"
          style={{
            gridTemplateColumns: '470px 470px',
            columnGap: '40px',
            rowGap: '40px',
            padding: '50px',
          }}
        >
          {tiles.map((name) => {
            const image = images[name] || firstImageBySubcat[name] || effective.heroImage || '';
            return (
              <Link
                key={name}
                href={`/home/${moduleKey}?cat=${encodeURIComponent(name)}`}
                aria-label={name}
                className="relative block overflow-hidden rounded-[20px] bg-cover bg-center"
                style={{
                  height: 262,
                  backgroundImage: image ? `url("${image}")` : undefined,
                  backgroundColor: image ? undefined : 'hsl(var(--brand-primary, 210 80% 30%))',
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ backgroundColor: 'hsl(0 0% 0% / 0.48)' }}
                />
                <span className="absolute inset-0 flex items-center justify-center px-6 text-center">
                  <span className="font-display text-[42px] font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                    {name}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Floating home button */}
      <FloatingHomeButton />

      {/* Search overlay dentro del canvas */}
      {searchOpen ? (
        <SearchOverlay listings={searchListings} onClose={() => setSearchOpen(false)} />
      ) : null}
    </div>
  );
}

/** Shape de cada entry recibida en `kiosk:listings-override` (array). Mismo
 *  shape que el de `ListingsModule`. */
type ListingsEntryPatch = {
  key: string;
  label?: string;
  iconKey?: string;
  enabled?: boolean;
  catalog?: {
    heroImage?: string;
    subcategories?: string[];
    features?: string[];
    listings?: Listing[];
  };
};
