'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { HomeListing, HomeTile, SurveyConfig } from '@/lib/config';

import { CategoryGrid } from './category-grid';
import { SearchBar } from './search-bar';
import { SearchOverlay } from './search-overlay';

type ModulesOverridePayload = {
  tiles: Array<{ key: string; label: string; enabled: boolean }>;
};

type SystemModulesPayload = Record<string, boolean>;

const TILE_KEY_TO_SYSTEM_FIELD: Record<string, string> = {
  restaurants: 'restaurants',
  'things-to-do': 'thingsToDo',
  'itinerary-builder': 'itineraryBuilder',
  events: 'events',
  passes: 'passes',
  tickets: 'tickets',
  guestbook: 'guestbook',
  'social-wall': 'socialWall',
  'digital-brochure': 'digitalBrochure',
  map: 'map',
  stay: 'stay',
  survey: 'survey',
  deals: 'deals',
  'photo-booth': 'photoBooth',
  trails: 'trails',
  wayfinding: 'wayfinding',
};

/**
 * Shell client-side del Home. El survey vive en `SurveyHost` a nivel del
 * KioskCanvas (para poder stackearse sobre los ads). Aquí sólo disparamos
 * el evento global cuando el tile Survey se tapea.
 *
 * `allTiles` recibe TODOS los tiles del cliente (incluyendo deshabilitados
 * y wayfinding) para que el override del Studio pueda reordenarlos / togglearlos
 * sin recargar la página. En runtime normal (sin Studio iframe), filtramos por
 * `enabled` igual que antes.
 */
export function HomeShell({
  header,
  listings,
  allTiles,
  survey,
}: {
  header: ReactNode;
  listings: readonly HomeListing[];
  allTiles: readonly HomeTile[];
  survey?: SurveyConfig;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [override, setOverride] = useState<ModulesOverridePayload | null>(null);
  const [sysOverride, setSysOverride] = useState<SystemModulesPayload | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ModulesOverridePayload>).detail;
      if (detail && Array.isArray(detail.tiles)) setOverride(detail);
    };
    const sysHandler = (e: Event) => {
      const detail = (e as CustomEvent<SystemModulesPayload>).detail;
      if (detail) setSysOverride(detail);
    };
    window.addEventListener('kiosk:modules-override', handler);
    window.addEventListener('kiosk:system-modules-override', sysHandler);
    return () => {
      window.removeEventListener('kiosk:modules-override', handler);
      window.removeEventListener('kiosk:system-modules-override', sysHandler);
    };
  }, []);

  const tilesByKey = useMemo(() => {
    const map = new Map<string, HomeTile>();
    for (const t of allTiles) map.set(t.key, t);
    return map;
  }, [allTiles]);

  const isCoreEnabled = (key: string): boolean => {
    if (!sysOverride) return true;
    const field = TILE_KEY_TO_SYSTEM_FIELD[key];
    if (!field) return true;
    const v = sysOverride[field];
    return typeof v === 'boolean' ? v : true;
  };

  const visibleTiles = useMemo<readonly HomeTile[]>(() => {
    if (!override) {
      return allTiles.filter((t) => t.enabled && isCoreEnabled(t.key));
    }
    const out: HomeTile[] = [];
    for (const entry of override.tiles) {
      if (!entry.enabled) continue;
      if (!isCoreEnabled(entry.key)) continue;
      const base = tilesByKey.get(entry.key);
      if (!base) continue;
      out.push({ ...base, label: entry.label });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override, sysOverride, allTiles, tilesByKey]);

  const openSurvey = survey?.enabled
    ? () => window.dispatchEvent(new CustomEvent('kiosk:survey-open'))
    : undefined;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {header}
      <SearchBar onOpen={() => setSearchOpen(true)} />
      <main
        className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ paddingTop: '40px', paddingBottom: '120px' }}
      >
        <CategoryGrid tiles={visibleTiles} onSurveyTap={openSurvey} />
      </main>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20"
        style={{
          height: '180px',
          background:
            'linear-gradient(to top, #f8f8f8 0%, rgba(248,248,248,0.85) 30%, rgba(248,248,248,0) 100%)',
        }}
      />
      {searchOpen ? (
        <SearchOverlay listings={listings} onClose={() => setSearchOpen(false)} />
      ) : null}
    </div>
  );
}
