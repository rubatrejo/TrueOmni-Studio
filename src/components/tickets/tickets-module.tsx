'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { WeekPicker } from '@/components/events/week-picker';
import { SearchOverlay } from '@/components/home/search-overlay';
import { useModuleLabel, useTextosMap } from '@/components/i18n-provider';
import { FavoriteAddedToast } from '@/components/listings/favorite-added-toast';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { ListingsToolbar } from '@/components/listings/listings-toolbar';
import { SortOverlay } from '@/components/listings/sort-overlay';
import type { EventItem, HomeListing, HomeTicketsModule } from '@/lib/config';
import { addDays, addWeeks, todayISO } from '@/lib/events-date';
import { applyEventsFilters, EMPTY_EVENTS_FILTER } from '@/lib/events-filter';
import type { EventsFilterState } from '@/lib/events-filter';
import type { EventsSortOrder } from '@/lib/events-sort';
import { EVENTS_SORT_OPTIONS, sortEvents } from '@/lib/events-sort';
import {
  deriveTicketCategories,
  deriveTicketFeatures,
  deriveTicketVenues,
  filterTicketableEvents,
  type TicketableEvent,
} from '@/lib/tickets';

import { TicketsFilterOverlay } from './tickets-filter-overlay';
import { TicketsList } from './tickets-list';

/**
 * Orquestrador del módulo Tickets. Filtra el pool de events del cliente
 * por `ticket != null` y reusa el flujo de Events (WeekPicker, filter, sort,
 * search). El filter-overlay usa catálogo derivado del pool visible (no del
 * superset de Events) para no mostrar categorías/venues sin tickets activos.
 */
export function TicketsModule({
  moduleKey,
  module: mod,
  allEvents,
  clientCoords,
  clientTimezone,
  header,
}: {
  moduleKey: string;
  module: HomeTicketsModule;
  /** Pool completo de events del cliente — se filtra aquí por ticket presente. */
  allEvents: readonly EventItem[];
  clientCoords?: { lat: number; lng: number };
  clientTimezone?: string;
  header: ReactNode;
}) {
  const textos = useTextosMap();
  const moduleLabel = useModuleLabel(moduleKey, mod.label);
  const today = useMemo(() => todayISO(clientTimezone), [clientTimezone]);

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filter, setFilter] = useState<EventsFilterState>(EMPTY_EVENTS_FILTER);
  const [sort, setSort] = useState<EventsSortOrder>('date');

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const allTickets = useMemo<TicketableEvent[]>(
    () => filterTicketableEvents(allEvents),
    [allEvents],
  );

  const catalogue = useMemo(
    () => ({
      categories: mod.categories ?? deriveTicketCategories(allTickets),
      venues: mod.venues ?? deriveTicketVenues(allTickets),
      features: mod.features ?? deriveTicketFeatures(allTickets),
    }),
    [mod.categories, mod.venues, mod.features, allTickets],
  );

  const visibleTickets = useMemo<TicketableEvent[]>(() => {
    const byDay = allTickets.filter((e) => e.date === selectedDate);
    return sortEvents(applyEventsFilters(byDay, filter), sort, clientCoords) as TicketableEvent[];
  }, [allTickets, selectedDate, filter, sort, clientCoords]);

  const searchItems: HomeListing[] = useMemo(
    () =>
      allTickets.map((t) => ({
        slug: t.slug,
        title: t.title,
        category: moduleKey,
        image: t.image,
      })),
    [allTickets, moduleKey],
  );

  const shiftWeek = useCallback((delta: number) => {
    setSelectedDate((d) => addWeeks(d, delta));
  }, []);
  const shiftDay = useCallback((delta: number) => {
    setSelectedDate((d) => addDays(d, delta));
  }, []);
  void shiftDay;

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
        <TicketsList
          tickets={visibleTickets}
          moduleKey={moduleKey}
          emptyLabel={textos.tickets_empty}
        />
      </main>

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

      <TicketsFilterOverlay
        open={filterOpen}
        catalogue={catalogue}
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
