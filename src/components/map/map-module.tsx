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
  KIOSK_EVENTS_OVERRIDE_EVENT,
  KIOSK_LISTINGS_OVERRIDE_EVENT,
  KIOSK_MAP_OVERRIDE_EVENT,
  getCachedClientCoords,
  getCachedClientName,
} from '@/components/studio-bridge';
import type { HomeListing, HomeMapModule, MapSource } from '@/lib/config';
import { availableChips, buildFeaturePool, buildSubcategoryPool } from '@/lib/map-aggregator';
import type { MapDetailLookup } from '@/lib/map-detail-lookup';
import { ALL_CHIPS, applyMapFilters, EMPTY_MAP_FILTER, toggleChip } from '@/lib/map-filter';
import type { MapFilterState } from '@/lib/map-filter';
import type { MapItem } from '@/lib/map-item';
import { DEFAULT_MAP_WELCOME_BODY } from '@/lib/studio/schema';

import { MapCanvas } from './map-canvas';
import { MapChips } from './map-chips';
import { MapFilterOverlay } from './map-filter-overlay';
import { MapPinBubble } from './map-pin-bubble';
import { dynamicPinColor, MAP_PIN_COLORS } from './map-pin-icons';
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

export interface DynamicListingEntry {
  /** moduleKey del listing (`shopping`, `wellness`, etc — NO canónico). */
  key: string;
  label: string;
  iconKey?: string;
  customIcon?: string;
}

export function MapModule({
  moduleKey,
  module: mod,
  items,
  dynamicListings: serverDynamicListings,
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
  /**
   * Listing modules NO canónicos del config (Shopping, Wellness, etc).
   * Se usan para construir chips/pins extra dinámicos. Server-rendered;
   * el bridge `kiosk:listings-override` los refresca en preview.
   */
  dynamicListings?: DynamicListingEntry[];
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

  // Map editor overrides (welcome copy, chips, default center/zoom, custom pins).
  // Declarado aquí (antes de los useMemo que dependen de él) para que TS no
  // se queje de "used before declaration".
  type MapEditorOverride = {
    welcomeCopy?: { title?: string; subtitle?: string; body?: string; cta?: string };
    chips?: { play?: string; eat?: string; stay?: string; events?: string };
    defaultCenter?: { lat: number; lng: number };
    defaultZoom?: number;
    pinSize?: 'S' | 'M' | 'L';
    categoryIcons?: Partial<Record<MapSource, string>>;
    customPins?: Array<{
      id: string;
      label: string;
      source: MapSource;
      iconKey?: string;
      coords: { lat: number; lng: number };
      address?: string;
    }>;
  };
  const [mapOverride, setMapOverride] = useState<MapEditorOverride | null>(null);
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<MapEditorOverride>).detail;
      if (!detail || typeof detail !== 'object') return;
      setMapOverride(detail);
    };
    window.addEventListener(KIOSK_MAP_OVERRIDE_EVENT, handler);
    return () => window.removeEventListener(KIOSK_MAP_OVERRIDE_EVENT, handler);
  }, []);

  const interpolatedWelcomeCopy = useMemo(() => {
    // Override del Map editor tiene prioridad. Si los 4 campos están vacíos,
    // entonces no se muestra welcome.
    const editorCopy = mapOverride?.welcomeCopy;
    const baseCopy = mod.welcomeCopy;
    const merged = editorCopy
      ? {
          title: editorCopy.title ?? baseCopy?.title ?? '',
          subtitle: editorCopy.subtitle ?? baseCopy?.subtitle,
          // Fallback al body por default cuando ni editor ni base tienen valor
          // — kiosks viejos guardaron `body: ''` en KV antes de que el schema
          // lo defaulteara a un texto humanizable.
          body: editorCopy.body || baseCopy?.body || DEFAULT_MAP_WELCOME_BODY,
          cta: editorCopy.cta ?? baseCopy?.cta ?? 'OK',
        }
      : baseCopy && baseCopy.body
        ? baseCopy
        : baseCopy
          ? { ...baseCopy, body: DEFAULT_MAP_WELCOME_BODY }
          : baseCopy;
    if (!merged) return undefined;
    const allEmpty =
      !merged.title?.trim() && !merged.body?.trim() && !merged.cta?.trim();
    if (allEmpty) return undefined;
    return {
      ...merged,
      title: reinterpolate(merged.title),
      body: reinterpolate(merged.body),
      subtitle: merged.subtitle ? reinterpolate(merged.subtitle) : undefined,
      cta: reinterpolate(merged.cta),
    };
  }, [mod.welcomeCopy, mapOverride?.welcomeCopy, reinterpolate]);

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

  // Live items reactivos a overrides del Studio. SSR pinta `items` del
  // cliente default (preview iframe carga KIOSK_CLIENT=default), por lo que
  // sin esta lógica el Map muestra siempre listings de Arizona aunque el
  // operador esté editando otro cliente. Aplicamos overrides por slug:
  // sustituimos title/address/image/subcategory/features/popularity/coords/
  // priceRange/hours sin reagregar (los slugs nuevos o borrados no se
  // reflejan — limitación aceptable para preview reactivo).
  const [liveItems, setLiveItems] = useState<MapItem[]>(items);
  const [liveDynamicListings, setLiveDynamicListings] = useState<DynamicListingEntry[]>(
    serverDynamicListings ?? [],
  );
  useEffect(() => {
    setLiveItems(items);
  }, [items]);
  useEffect(() => {
    setLiveDynamicListings(serverDynamicListings ?? []);
  }, [serverDynamicListings]);
  useEffect(() => {
    const onListings = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!Array.isArray(detail)) return;
      // Detectar listing modules dinámicos (no canónicos) y extraer su
      // metadata para construir chips/pins extra. Los 4 canónicos siguen
      // por la pista hardcoded.
      const CANONICAL = new Set(['restaurants', 'things-to-do', 'stay']);
      const dynEntries: DynamicListingEntry[] = [];
      for (const entry of detail as Array<{
        key?: string;
        label?: string;
        iconKey?: string;
        customIcon?: string;
        enabled?: boolean;
        catalog?: { listings?: Array<Record<string, unknown>> };
      }>) {
        if (!entry?.key || CANONICAL.has(entry.key)) continue;
        if (entry.enabled === false) continue;
        dynEntries.push({
          key: entry.key,
          label: entry.label ?? entry.key,
          iconKey: entry.iconKey,
          customIcon: entry.customIcon,
        });
      }
      setLiveDynamicListings(dynEntries);
      // Sustituir los items dinámicos del live state por los del override
      // (con jitter recalculado en el caller no aplica aquí — usamos coords
      // del override directamente).
      const dynItems: MapItem[] = [];
      for (const entry of detail as Array<{
        key?: string;
        catalog?: { listings?: Array<Record<string, unknown>> };
      }>) {
        if (!entry?.key || CANONICAL.has(entry.key)) continue;
        const list = entry.catalog?.listings;
        if (!Array.isArray(list)) continue;
        for (const l of list) {
          if (typeof l.slug !== 'string') continue;
          dynItems.push({
            source: entry.key,
            moduleSlug: entry.key,
            slug: l.slug,
            title: typeof l.title === 'string' ? l.title : l.slug,
            subcategory: typeof l.subcategory === 'string' ? l.subcategory : '',
            image: typeof l.image === 'string' ? l.image : '',
            coords:
              l.coords && typeof l.coords === 'object'
                ? (l.coords as { lat: number; lng: number })
                : { lat: 0, lng: 0 },
            address: typeof l.address === 'string' ? l.address : '',
            phone: typeof l.phone === 'string' ? l.phone : undefined,
            features: Array.isArray(l.features) ? (l.features as string[]) : [],
            popularity: typeof l.popularity === 'number' ? l.popularity : 50,
            hours: typeof l.hours === 'string' ? l.hours : undefined,
            priceRange: (typeof l.priceRange === 'number'
              ? l.priceRange
              : undefined) as MapItem['priceRange'],
          });
        }
      }
      // Index slug → listing del override (para los CANÓNICOS solo
      // actualizamos fields; para los dinámicos ya agregamos a `dynItems`
      // arriba).
      const bySlug = new Map<
        string,
        {
          title?: string;
          address?: string;
          image?: string;
          subcategory?: string;
          features?: string[];
          popularity?: number;
          hours?: string;
          coords?: { lat: number; lng: number };
          phone?: string;
          priceRange?: 1 | 2 | 3 | 4;
        }
      >();
      for (const entry of detail as Array<{
        key?: string;
        catalog?: { listings?: Array<Record<string, unknown>> };
      }>) {
        if (!entry?.catalog?.listings) continue;
        if (entry.key && !CANONICAL.has(entry.key)) continue; // dynItems ya cubrió esto
        for (const l of entry.catalog.listings) {
          if (typeof l.slug === 'string') bySlug.set(l.slug, l as never);
        }
      }
      setLiveItems((prev) => {
        // 1. Update fields de items canónicos por slug.
        const updated = prev.map((it) => {
          if (it.source === 'events') return it;
          // Items dinámicos viejos: los reemplazamos abajo.
          if (!CANONICAL.has(it.source) && it.source !== 'events') return it;
          const o = bySlug.get(it.slug);
          if (!o) return it;
          return {
            ...it,
            title: o.title ?? it.title,
            address: o.address ?? it.address,
            image: o.image ?? it.image,
            subcategory: o.subcategory ?? it.subcategory,
            features: Array.isArray(o.features) ? o.features : it.features,
            popularity: typeof o.popularity === 'number' ? o.popularity : it.popularity,
            hours: o.hours ?? it.hours,
            phone: o.phone ?? it.phone,
            priceRange: o.priceRange ?? it.priceRange,
            coords: o.coords ?? it.coords,
          };
        });
        // 2. Quitar items dinámicos viejos (source no canonical y no events).
        const noDyn = updated.filter(
          (it) => CANONICAL.has(it.source) || it.source === 'events',
        );
        // 3. Añadir los nuevos dynItems.
        return [...noDyn, ...dynItems];
      });
    };
    const onEvents = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== 'object') return;
      const evList = (detail as { events?: Array<Record<string, unknown>> }).events;
      if (!Array.isArray(evList)) return;
      const bySlug = new Map<string, Record<string, unknown>>();
      for (const e of evList) {
        if (typeof e.slug === 'string') bySlug.set(e.slug, e);
      }
      if (bySlug.size === 0) return;
      setLiveItems((prev) =>
        prev.map((it) => {
          if (it.source !== 'events') return it;
          const o = bySlug.get(it.slug);
          if (!o) return it;
          return {
            ...it,
            title: typeof o.title === 'string' ? o.title : it.title,
            address: typeof o.address === 'string' ? o.address : it.address,
            image: typeof o.image === 'string' ? o.image : it.image,
            subcategory: typeof o.category === 'string' ? o.category : it.subcategory,
            features: Array.isArray(o.features) ? (o.features as string[]) : it.features,
            popularity: typeof o.popularity === 'number' ? (o.popularity as number) : it.popularity,
            phone: typeof o.phone === 'string' ? o.phone : it.phone,
            coords:
              o.coords && typeof o.coords === 'object'
                ? (o.coords as { lat: number; lng: number })
                : it.coords,
          };
        }),
      );
    };
    window.addEventListener(KIOSK_LISTINGS_OVERRIDE_EVENT, onListings);
    window.addEventListener(KIOSK_EVENTS_OVERRIDE_EVENT, onEvents);
    return () => {
      window.removeEventListener(KIOSK_LISTINGS_OVERRIDE_EVENT, onListings);
      window.removeEventListener(KIOSK_EVENTS_OVERRIDE_EVENT, onEvents);
    };
  }, []);

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

  // Fusion de pins: liveItems (listings + events SSR/overrides) + customPins
  // del Map editor. Los custom van como MapItem mínimo con coords y label.
  const allItems = useMemo<MapItem[]>(() => {
    if (!mapOverride?.customPins?.length) return liveItems;
    const customs: MapItem[] = mapOverride.customPins.map((p) => ({
      source: p.source,
      moduleSlug: 'custom',
      slug: p.id,
      title: p.label,
      subcategory: '',
      image: '',
      coords: p.coords,
      address: p.address ?? '',
      features: [],
      popularity: 50,
      iconKey: p.iconKey || undefined,
    }));
    return [...liveItems, ...customs];
  }, [liveItems, mapOverride?.customPins]);

  const visibleItems = useMemo(() => applyMapFilters(allItems, filter), [allItems, filter]);
  const available = useMemo(() => availableChips(allItems), [allItems]);
  // Los pools completos son muy largos (30+ features entre 4 kinds). Recortamos
  // a la mitad para que el overlay de filtros se vea limpio — se pueden ampliar
  // si el cliente lo pide.
  const featuresPool = useMemo(() => {
    const pool = buildFeaturePool(allItems);
    return pool.slice(0, Math.max(4, Math.ceil(pool.length / 2)));
  }, [allItems]);
  const subcategoriesPool = useMemo(() => {
    const pool = buildSubcategoryPool(allItems);
    return pool.slice(0, Math.max(4, Math.ceil(pool.length / 2)));
  }, [allItems]);

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

  const chipDefs = useMemo(() => {
    // 1. Chips canónicos (Things to Do / Restaurants / Stay / Events).
    const canonical = DEFAULT_CHIP_DEFS.map((c) => {
      const fromOverride = mapOverride?.chips?.[c.chipKey];
      const fromConfig = mod.chips?.[c.chipKey];
      const LEGACY = new Map([
        ['Play', 'Things to Do'],
        ['Eat', 'Restaurants'],
      ]);
      const raw = fromOverride ?? fromConfig;
      const label = raw ? (LEGACY.get(raw) ?? raw) : c.defaultLabel;
      return { source: c.source, label, bgColor: c.bg };
    });
    // 2. Chips dinámicos por cada listing module no canónico.
    const dynamic = liveDynamicListings.map((d) => ({
      source: d.key,
      label: d.label,
      bgColor: dynamicPinColor(d.key),
    }));
    return [...canonical, ...dynamic];
  }, [mod.chips, mapOverride?.chips, liveDynamicListings]);

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

  const center =
    mapOverride?.defaultCenter ?? mod.defaultCenter ?? effectiveCoords ?? { lat: 33.4484, lng: -112.074 };
  const zoom = mapOverride?.defaultZoom ?? mod.defaultZoom ?? 13;
  const PIN_SCALE = { S: 0.75, M: 1.0, L: 1.3 } as const;
  const pinScale = PIN_SCALE[mapOverride?.pinSize ?? 'M'];
  const categoryIcons = mapOverride?.categoryIcons;

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
          pinScale={pinScale}
          categoryIcons={categoryIcons}
          dynamicListings={liveDynamicListings}
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
