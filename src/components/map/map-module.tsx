'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import { useTextosMap } from '@/components/i18n-provider';
import { FavoriteAddedToast } from '@/components/listings/favorite-added-toast';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { ListingDetail } from '@/components/listings/listing-detail';
import {
  KIOSK_CLIENT_COORDS_OVERRIDE_EVENT,
  KIOSK_CLIENT_NAME_OVERRIDE_EVENT,
  getCachedClientCoords,
  getCachedClientName,
} from '@/components/studio-bridge';
import type { HomeListing, HomeMapModule, MapSource } from '@/lib/config';
import { availableChips, buildFeaturePool, buildSubcategoryPool } from '@/lib/map-aggregator';
import type { MapDetailLookup } from '@/lib/map-detail-lookup';
import { ALL_CHIPS, applyMapFilters, EMPTY_MAP_FILTER, toggleChip } from '@/lib/map-filter';
import type { MapFilterState } from '@/lib/map-filter';
import type { MapItem } from '@/lib/map-item';

import { MapCanvas } from './map-canvas';
import { MapChips } from './map-chips';
import { MapFilterOverlay } from './map-filter-overlay';
import { MapPinBubble } from './map-pin-bubble';
import { MAP_PIN_COLORS } from './map-pin-icons';
import { MapToolbar } from './map-toolbar';
import { MapTopCarousel } from './map-top-carousel';
import { MAP_WELCOME_STORAGE_KEY, MapWelcomePopup } from './map-welcome-popup';

/**
 * Colores del chip por categoría — ALINEADOS con los pins del mapa:
 *   Play  `hsl(var(--brand-primary))`  (things-to-do)
 *   Eat   `hsl(var(--brand-secondary))`  (restaurants)
 *   Stay  `hsl(var(--brand-tertiary))`  (stay)
 *   Events `#f16651` (events)
 */
// Labels de chips alineados con los del Home Dashboard / módulos Listings
// para mantener consistencia: el operador ve "Restaurants" / "Things to Do"
// en ambos sitios (no "Eat" / "Play"). Los `chipKey` siguen siendo cortos
// para no romper i18n keys ya publicadas.
const DEFAULT_CHIP_DEFS: {
  source: MapSource;
  defaultLabel: string;
  chipKey: 'play' | 'eat' | 'stay' | 'events';
  bg: string;
}[] = [
  {
    source: 'things-to-do',
    defaultLabel: 'Things to Do',
    chipKey: 'play',
    bg: MAP_PIN_COLORS['things-to-do'],
  },
  { source: 'restaurants', defaultLabel: 'Restaurants', chipKey: 'eat', bg: MAP_PIN_COLORS.restaurants },
  { source: 'stay', defaultLabel: 'Stay', chipKey: 'stay', bg: MAP_PIN_COLORS.stay },
  { source: 'events', defaultLabel: 'Events', chipKey: 'events', bg: MAP_PIN_COLORS.events },
];

export interface MapModuleTextos {
  seeMoreInfo: string;
  addToItinerary: string;
  addedToItinerary: string;
  miAwaySuffix: string;
  minWalkingSuffix: string;
  filtersTitle: string;
  clearAll: string;
  apply: string;
  featuresLabel?: string;
  subcategoriesLabel?: string;
  selectAll: string;
  exploreTitle: string;
}

export function MapModule({
  moduleKey,
  module: mod,
  items,
  clientCoords,
  clientName: serverClientName,
  mapboxToken,
  textos,
  detailLookup,
  alwaysShowWelcome = false,
  header,
}: {
  moduleKey: string;
  module: HomeMapModule;
  clientCoords?: { lat: number; lng: number };
  /** Nombre del cliente del SSR — fallback cuando el bridge del Studio no
   *  está activo (kiosk runtime normal). Se usa para interpolar
   *  `{client}` en `exploreTitle` y `welcomeCopy`. */
  clientName?: string;
  mapboxToken: string | undefined;
  items: MapItem[];
  textos: MapModuleTextos;
  detailLookup: MapDetailLookup;
  /** Si true, ignora el sessionStorage y siempre muestra el welcome (para QA). */
  alwaysShowWelcome?: boolean;
  header: ReactNode;
}) {
  void moduleKey;

  // Reactive client coords: el bridge del Studio dispatcha
  // `kiosk:client-coords-override` cuando el operador crea/edita un kiosk
  // con location distinta. Centra el mapa en la nueva location sin
  // requerir publish.
  const [reactiveCoords, setReactiveCoords] = useState<{ lat: number; lng: number } | undefined>(
    () => getCachedClientCoords() ?? clientCoords,
  );
  useEffect(() => {
    const onOverride = (event: Event) => {
      const detail = (event as CustomEvent<{ coords?: { lat: number; lng: number } }>).detail;
      if (detail?.coords) setReactiveCoords(detail.coords);
    };
    window.addEventListener(KIOSK_CLIENT_COORDS_OVERRIDE_EVENT, onOverride);
    return () => window.removeEventListener(KIOSK_CLIENT_COORDS_OVERRIDE_EVENT, onOverride);
  }, []);
  const effectiveCoords = reactiveCoords ?? clientCoords;

  // Reactive client name: re-interpola `{client}` placeholder en el
  // exploreTitle (ej. "Explore {client} Map") cuando el operador edita
  // el nombre del kiosk en el Studio. Sin este hook el preview se
  // queda con el nombre server-rendered ("Arizona") hasta publish.
  const [reactiveClientName, setReactiveClientName] = useState<string | null>(
    () => getCachedClientName(),
  );
  useEffect(() => {
    const onName = (event: Event) => {
      const detail = (event as CustomEvent<{ clientName?: string }>).detail;
      if (detail?.clientName) setReactiveClientName(detail.clientName);
    };
    window.addEventListener(KIOSK_CLIENT_NAME_OVERRIDE_EVENT, onName);
    return () => window.removeEventListener(KIOSK_CLIENT_NAME_OVERRIDE_EVENT, onName);
  }, []);
  // exploreTitle viene como template (`Explore {client} Map`). Interpola
  // con: 1) reactiveClientName (override del bridge en preview Studio),
  // 2) serverClientName (config.client.nombre del SSR — kiosk runtime
  // normal). Si ninguno está disponible, reemplaza por string vacío para
  // no mostrar "{client}" literal.
  const effectiveClientName = reactiveClientName ?? serverClientName ?? '';
  const reinterpolate = useCallback(
    (raw: string): string => {
      if (typeof raw !== 'string' || !raw) return raw;
      // Reemplaza tanto `{client}` (template) como cualquier mención
      // hardcoded del nombre server-rendered (ej. "Welcome to Arizona Map"
      // en welcomeCopy.title que se publicó pre-interpolado).
      let out = raw.replaceAll('{client}', effectiveClientName);
      if (
        serverClientName &&
        reactiveClientName &&
        serverClientName !== reactiveClientName &&
        out.includes(serverClientName)
      ) {
        out = out.replaceAll(serverClientName, reactiveClientName);
      }
      return out.replace(/\s{2,}/g, ' ').trim();
    },
    [effectiveClientName, reactiveClientName, serverClientName],
  );
  const interpolatedExploreTitle = useMemo(
    () => reinterpolate(textos.exploreTitle),
    [textos.exploreTitle, reinterpolate],
  );
  const interpolatedWelcomeCopy = useMemo(() => {
    if (!mod.welcomeCopy) return undefined;
    return {
      ...mod.welcomeCopy,
      title: reinterpolate(mod.welcomeCopy.title),
      body: reinterpolate(mod.welcomeCopy.body),
      subtitle: mod.welcomeCopy.subtitle ? reinterpolate(mod.welcomeCopy.subtitle) : undefined,
      cta: reinterpolate(mod.welcomeCopy.cta),
    };
  }, [mod.welcomeCopy, reinterpolate]);

  // Override textos pre-renderizados por el caller con el idioma activo.
  const liveTextos = useTextosMap();
  const incomingTextos = textos;
  textos = {
    seeMoreInfo: liveTextos.map_see_more_info ?? incomingTextos.seeMoreInfo,
    addToItinerary: liveTextos.map_add_to_itinerary ?? incomingTextos.addToItinerary,
    addedToItinerary: liveTextos.map_added_to_itinerary ?? incomingTextos.addedToItinerary,
    miAwaySuffix: liveTextos.map_mi_away_suffix ?? incomingTextos.miAwaySuffix,
    minWalkingSuffix: liveTextos.map_min_walking_suffix ?? incomingTextos.minWalkingSuffix,
    filtersTitle: liveTextos.filters_title ?? incomingTextos.filtersTitle,
    clearAll: liveTextos.filters_clear_all ?? incomingTextos.clearAll,
    apply: liveTextos.filters_apply ?? incomingTextos.apply,
    featuresLabel: liveTextos.filters_features ?? incomingTextos.featuresLabel,
    subcategoriesLabel: liveTextos.filters_category ?? incomingTextos.subcategoriesLabel,
    selectAll: liveTextos.map_select_all ?? incomingTextos.selectAll,
    exploreTitle: incomingTextos.exploreTitle,
  };

  const [filter, setFilter] = useState<MapFilterState>(EMPTY_MAP_FILTER);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [pinPos, setPinPos] = useState<{ left: number; top: number } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  useEffect(() => {
    if (!mod.welcomeCopy) return;
    if (alwaysShowWelcome) {
      setShowWelcome(true);
      return;
    }
    try {
      if (window.sessionStorage.getItem(MAP_WELCOME_STORAGE_KEY) !== '1') {
        setShowWelcome(true);
      }
    } catch {
      /* ignore */
    }
  }, [mod.welcomeCopy, alwaysShowWelcome]);

  const visibleItems = useMemo(() => applyMapFilters(items, filter), [items, filter]);
  const available = useMemo(() => availableChips(items), [items]);
  // Los pools completos son muy largos (30+ features entre 4 kinds). Recortamos
  // a la mitad para que el overlay de filtros se vea limpio — se pueden ampliar
  // si el cliente lo pide.
  const featuresPool = useMemo(() => {
    const pool = buildFeaturePool(items);
    return pool.slice(0, Math.max(4, Math.ceil(pool.length / 2)));
  }, [items]);
  const subcategoriesPool = useMemo(() => {
    const pool = buildSubcategoryPool(items);
    return pool.slice(0, Math.max(4, Math.ceil(pool.length / 2)));
  }, [items]);

  const searchItems: HomeListing[] = useMemo(
    () =>
      visibleItems.map((it) => ({
        slug: it.slug,
        title: it.title,
        category: it.moduleSlug,
        image: it.image,
      })),
    [visibleItems],
  );

  const chipDefs = useMemo(
    () =>
      DEFAULT_CHIP_DEFS.map((c) => {
        const fromConfig = mod.chips?.[c.chipKey];
        // Override legacy: kiosks publicados con "Play"/"Eat" hardcoded en
        // chips se actualizan al nuevo naming sin requerir migración del
        // config en KV ni filesystem.
        const LEGACY = new Map([
          ['Play', 'Things to Do'],
          ['Eat', 'Restaurants'],
        ]);
        const label = fromConfig ? (LEGACY.get(fromConfig) ?? fromConfig) : c.defaultLabel;
        return {
          source: c.source,
          label,
          bgColor: c.bg,
        };
      }),
    [mod.chips],
  );

  const handleToggleChip = useCallback((source: MapSource) => {
    setFilter((s) => toggleChip(s, source));
  }, []);

  const handleSelectAll = useCallback(() => {
    setFilter((s) => ({ ...s, activeChips: ALL_CHIPS }));
  }, []);

  const handleSelect = useCallback((slug: string) => {
    setSelectedSlug((prev) => (prev === slug ? null : slug));
  }, []);

  const handleDismissWelcome = useCallback(() => {
    try {
      window.sessionStorage.setItem(MAP_WELCOME_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setShowWelcome(false);
  }, []);

  const center = mod.defaultCenter ?? effectiveCoords ?? { lat: 33.4484, lng: -112.074 };
  const zoom = mod.defaultZoom ?? 13;

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      {/* Hero 1080×620 — gradient + logo/clock + carrusel + chips (SIN toolbar). */}
      <div className="absolute left-0 right-0 top-0" style={{ height: '620px' }}>
        {header}
        <div
          className="pointer-events-none absolute left-0 right-0"
          style={{ top: '140px', bottom: '0' }}
        >
          <div className="pointer-events-auto flex h-full w-full flex-col justify-end gap-6 pb-4">
            <MapTopCarousel
              items={visibleItems}
              selectedSlug={selectedSlug}
              clientCoords={effectiveCoords}
              onSelect={handleSelect}
            />
            <MapChips
              chips={chipDefs}
              active={filter.activeChips}
              onToggle={handleToggleChip}
              onSelectAll={handleSelectAll}
              selectAllLabel={textos.selectAll}
              availableSources={available}
            />
          </div>
        </div>
      </div>

      {/* Toolbar 1080×118 DEBAJO del hero (igual que en Things to Do, Events,
          Listings, etc.). Total área azul (hero + toolbar) = 738px, coincide
          con el block azul de los demás módulos. */}
      <div className="absolute left-0 right-0" style={{ top: '620px', height: '118px' }}>
        <MapToolbar
          label={interpolatedExploreTitle}
          onSearch={() => setShowSearch(true)}
          onFilter={() => setShowFilters(true)}
        />
      </div>

      <main className="absolute left-0 right-0 overflow-hidden" style={{ top: '738px', bottom: 0 }}>
        <MapCanvas
          token={mapboxToken}
          items={visibleItems}
          center={center}
          zoom={zoom}
          selectedSlug={selectedSlug}
          onSelect={handleSelect}
          onSelectedPosition={setPinPos}
          style={{ width: '100%', height: '100%' }}
        />

        {selectedSlug && pinPos
          ? (() => {
              const item = visibleItems.find((it) => it.slug === selectedSlug);
              if (!item) return null;
              return (
                <MapPinBubble
                  item={item}
                  left={pinPos.left}
                  top={pinPos.top}
                  clientCoords={effectiveCoords}
                  labels={{
                    seeMoreInfo: textos.seeMoreInfo,
                    addToItinerary: textos.addToItinerary,
                    addedToItinerary: textos.addedToItinerary,
                    miAwaySuffix: textos.miAwaySuffix,
                    minWalkingSuffix: textos.minWalkingSuffix,
                  }}
                  onSeeMore={() => {
                    setDetailKey(`${item.moduleSlug}:${item.slug}`);
                    setSelectedSlug(null); // cerrar bubble al abrir detail
                  }}
                  onClose={() => setSelectedSlug(null)}
                />
              );
            })()
          : null}
      </main>

      <FloatingHomeButton />

      {showWelcome && interpolatedWelcomeCopy ? (
        <MapWelcomePopup copy={interpolatedWelcomeCopy} onDismiss={handleDismissWelcome} />
      ) : null}

      <MapFilterOverlay
        open={showFilters}
        featuresPool={featuresPool}
        subcategoriesPool={subcategoriesPool}
        initial={filter}
        labels={{
          title: textos.filtersTitle,
          clearAll: textos.clearAll,
          apply: textos.apply,
          featuresLabel: textos.featuresLabel,
          subcategoriesLabel: textos.subcategoriesLabel,
        }}
        onApply={(next) => {
          setFilter(next);
          setShowFilters(false);
        }}
        onCancel={() => setShowFilters(false)}
      />

      {showSearch ? (
        <SearchOverlay listings={searchItems} onClose={() => setShowSearch(false)} />
      ) : null}

      {detailKey && detailLookup[detailKey]
        ? (() => {
            const entry = detailLookup[detailKey];
            return (
              <ListingDetail
                moduleKey={entry.moduleKey}
                listing={entry.listing}
                mapboxToken={mapboxToken}
                clientCoords={effectiveCoords}
                eventMeta={entry.eventMeta}
                secondaryCta={entry.secondaryCta}
                favoritesKind={entry.favoritesKind}
                onClose={() => setDetailKey(null)}
              />
            );
          })()
        : null}

      <FavoriteAddedToast />
    </div>
  );
}
