'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import { useModuleHeroBridge } from '@/components/home/use-module-hero-bridge';
import { useModuleLabel } from '@/components/i18n-provider';
import { FavoriteAddedToast } from '@/components/listings/favorite-added-toast';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { ListingsToolbar } from '@/components/listings/listings-toolbar';
import { SortOverlay } from '@/components/listings/sort-overlay';
import type { EventItem, HomeEventsModule, HomeListing } from '@/lib/config';
import { addDays, addWeeks, todayISO } from '@/lib/events-date';
import { applyEventsFilters, EMPTY_EVENTS_FILTER } from '@/lib/events-filter';
import type { EventsFilterState } from '@/lib/events-filter';
import type { EventsSortOrder } from '@/lib/events-sort';
import { EVENTS_SORT_OPTIONS, sortEvents } from '@/lib/events-sort';

import { EventsFilterOverlay } from './events-filter-overlay';
import { EventsList } from './events-list';
import { WeekPicker } from './week-picker';

/**
 * Orquestrador del módulo Events. Sigue la misma estructura que `ListingsModule`:
 *   - Header hero (pasado como prop).
 *   - Toolbar (reusa `ListingsToolbar` con label "Upcoming Events").
 *   - WeekPicker (flechas + 7 pills). Siempre arranca con `selectedDate = hoy`.
 *   - Lista filtrada por día + filtros + sort.
 *   - Overlays: Search, Filter, Sort.
 */
export function EventsModule({
  moduleKey,
  module: mod,
  clientCoords,
  clientTimezone,
  header,
}: {
  moduleKey: string;
  module: HomeEventsModule;
  clientCoords?: { lat: number; lng: number };
  clientTimezone?: string;
  header: ReactNode;
}) {
  const moduleLabel = useModuleLabel(moduleKey, mod.label);
  const today = useMemo(() => todayISO(clientTimezone), [clientTimezone]);

  // Live preview override del Studio (S3.7).
  const [override, setOverride] = useState<HomeEventsModule | null>(null);
  const effective: HomeEventsModule = override ?? mod;
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          label?: string;
          heroImage?: string;
          categories?: string[];
          venues?: string[];
          features?: string[];
          events?: EventItem[];
        }>
      ).detail;
      if (!detail || !Array.isArray(detail.events)) return;
      setOverride({
        kind: 'events',
        label: detail.label ?? mod.label,
        heroImage: detail.heroImage ?? mod.heroImage,
        categories: detail.categories ?? mod.categories,
        venues: detail.venues ?? mod.venues,
        features: detail.features ?? mod.features,
        events: detail.events,
      });
    };
    window.addEventListener('kiosk:events-override', handler);
    return () => window.removeEventListener('kiosk:events-override', handler);
  }, [mod.label, mod.heroImage, mod.categories, mod.venues, mod.features]);

  // Empuja el hero efectivo al HomeHeader (preview live del Studio).
  useModuleHeroBridge(effective.heroImage);

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filter, setFilter] = useState<EventsFilterState>(EMPTY_EVENTS_FILTER);
  const [sort, setSort] = useState<EventsSortOrder>('date');

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Eventos del día seleccionado → filter → sort.
  const visibleEvents = useMemo<EventItem[]>(() => {
    const byDay = effective.events.filter((e) => e.date === selectedDate);
    return sortEvents(applyEventsFilters(byDay, filter), sort, clientCoords);
  }, [effective.events, selectedDate, filter, sort, clientCoords]);

  // Adapter para el SearchOverlay existente (espera HomeListing[]).
  const searchItems: HomeListing[] = useMemo(
    () =>
      effective.events.map((e) => ({
        slug: e.slug,
        title: e.title,
        category: moduleKey,
        image: e.image,
      })),
    [effective.events, moduleKey],
  );

  const shiftWeek = useCallback((delta: number) => {
    setSelectedDate((d) => addWeeks(d, delta));
  }, []);
  const shiftDay = useCallback((delta: number) => {
    setSelectedDate((d) => addDays(d, delta));
  }, []);
  void shiftDay; // reservado para navegación por teclado v2

  const sortOptionsForOverlay = useMemo(
    () =>
      EVENTS_SORT_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
        disabled: o.value === 'distance' && !clientCoords,
      })),
    [clientCoords],
  );

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {header}

      <ListingsToolbar
        label={moduleLabel}
        onSearch={() => setSearchOpen(true)}
        onSort={() => setSortOpen(true)}
        onFilter={() => setFilterOpen(true)}
        activeSort={sort !== 'date' || filter.features.length > 0}
      />

      <WeekPicker
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onPrevWeek={() => shiftWeek(-1)}
        onNextWeek={() => shiftWeek(1)}
      />

      <main className="scrollbar-hide relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <EventsList events={visibleEvents} moduleKey={moduleKey} />
      </main>

      {/* Scroll-hint gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: '140px',
          background:
            'linear-gradient(180deg, rgba(248,248,248,0) 0%, rgba(248,248,248,0.95) 75%, rgba(248,248,248,1) 100%)',
        }}
      />

      <FloatingHomeButton />

      <EventsFilterOverlay
        open={filterOpen}
        mod={effective}
        initial={filter}
        onCancel={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilter(next);
          setFilterOpen(false);
        }}
      />
      <SortOverlay
        open={sortOpen}
        current={sort}
        options={sortOptionsForOverlay}
        onSelect={(next) => {
          setSort(next as EventsSortOrder);
          setSortOpen(false);
        }}
        onCancel={() => setSortOpen(false)}
      />
      {searchOpen ? (
        <SearchOverlay listings={searchItems} onClose={() => setSearchOpen(false)} />
      ) : null}

      <FavoriteAddedToast />
    </div>
  );
}
