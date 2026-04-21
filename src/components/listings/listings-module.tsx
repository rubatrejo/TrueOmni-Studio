'use client';

import { useMemo, useState } from 'react';

import type { HomeModule } from '@/lib/config';

import { FloatingHomeButton } from './floating-home-button';
import { ListingsGrid } from './listings-grid';
import { ListingsToolbar } from './listings-toolbar';

/**
 * Orquestrador del módulo de Listings (Restaurants / Things to Do / Stay).
 *
 * Layout (verbatim SVG Food & Drink, 1080×scrollable):
 *   y=0..620     — Hero image + blue gradient overlay (fijo visual).
 *   y=620..738   — Toolbar (label + search/sort/filter icons) fijo.
 *   y=738..→     — Grid 3-col scrollable con infinite scroll.
 *
 * Esta v1 es sólo Main (Ola 2). Olas siguientes wirean favoritos, filtros,
 * sort, search modal (overlays que viven dentro de este orquestrador).
 */
export function ListingsModule({
  moduleKey,
  module: mod,
}: {
  moduleKey: string;
  module: HomeModule;
}) {
  // Filtros/sort se agregan en Ola 5. Por ahora muestra todas, orden por popularidad.
  const visible = useMemo(
    () => [...mod.listings].sort((a, b) => b.popularity - a.popularity),
    [mod.listings],
  );

  // Placeholders para props que wirean las olas siguientes
  const [, setSearchOpen] = useState(false);
  const [, setFilterOpen] = useState(false);
  const [, setSortOpen] = useState(false);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {/* Hero image + gradient */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '620px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mod.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,79,139,0.55) 100%)',
          }}
        />
      </div>

      {/* Toolbar */}
      <ListingsToolbar
        label={mod.label}
        onSearch={() => setSearchOpen(true)}
        onSort={() => setSortOpen(true)}
        onFilter={() => setFilterOpen(true)}
      />

      {/* Grid scrollable */}
      <main className="scrollbar-hide relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <ListingsGrid listings={visible} moduleKey={moduleKey} />
      </main>

      {/* Floating home button */}
      <FloatingHomeButton />
    </div>
  );
}
