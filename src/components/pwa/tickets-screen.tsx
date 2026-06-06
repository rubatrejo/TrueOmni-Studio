'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaTicketsModuleConfig } from '@/lib/config';
import { addWeeks, formatTime12, todayISO } from '@/lib/events-date';
import {
  applyEventsFilters,
  isEventsFilterEmpty,
  type EventsFilterState,
} from '@/lib/events-filter';
import { sortEvents } from '@/lib/events-sort';
import { useTicketFavorites } from '@/lib/favorites';
import { EMPTY_FILTER, type FilterState } from '@/lib/listings-filter';
import { pwaShare } from '@/lib/pwa-share';
import type { TicketableEvent } from '@/lib/tickets';

import { PwaBottomNav } from './bottom-nav';
import { ProfileIcon, SearchIcon } from './dashboard-icons';
import { PwaFilterOverlay, type FilterTexts } from './pwa-filter-overlay';
import { PwaHeart } from './pwa-heart';
import { PwaWeekPicker } from './pwa-week-picker';
import { SavedTripButton } from './saved-trip-button';
import { ShareIconButton } from './share-icon-button';

const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const PIN = 'hsl(var(--pwa-events-pin))';
const LINE = 'hsl(var(--brand-primary) / 0.25)';
const OPEN_SANS = 'var(--font-open-sans)';

/** Pool ordenado de valores únicos de un campo de los tickets. */
function poolOf(
  events: readonly TicketableEvent[],
  pick: (e: TicketableEvent) => string,
): string[] {
  const set = new Set<string>();
  for (const e of events) set.add(pick(e));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Traduce el estado del overlay (FilterState) al filtro de eventos. */
function toEventsFilter(f: FilterState): EventsFilterState {
  const prices: ('free' | 1 | 2 | 3 | 4)[] = [...f.priceRanges];
  if (f.free) prices.unshift('free');
  return {
    features: [...f.features],
    categories: [...f.subcategories],
    venues: [...(f.venues ?? [])],
    prices,
  };
}

/** Día inicial: hoy si tiene tickets; si no, el primero ≥ hoy; si no, el primero. */
function initialDate(tickets: readonly TicketableEvent[]): string {
  const today = todayISO();
  const dates = [...new Set(tickets.map((t) => t.date))].sort();
  if (dates.includes(today)) return today;
  return dates.find((d) => d >= today) ?? dates[0] ?? today;
}

/**
 * Tickets #1 — timeline por día (`/pwa/tickets`). Réplica del módulo Events PWA
 * (`events-timeline-screen.tsx`) con dos añadidos del kiosk: el **WeekPicker**
 * (selector de día) y un **badge de precio** en cada card. Tickets ⊂ Events: la
 * data son los `EventItem` con campo `ticket` (`filterTicketableEvents`). Como se
 * filtra a un solo día, el rail izquierdo muestra la **hora** (timeline horaria).
 *
 * White-label: textos desde `config.features.pwa.tickets`; data de
 * `home.modules.events`; colores por tokens.
 */
export function TicketsScreen({
  texts,
  tickets,
}: {
  texts: PwaTicketsModuleConfig;
  tickets: TicketableEvent[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => initialDate(tickets));
  // Favoritos de tickets persistentes (sessionStorage) — C3.
  const { isFavorited, toggle: toggleFav } = useTicketFavorites();
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);

  // Pools del overlay (derivados de todos los tickets).
  const featurePool = useMemo(() => {
    const set = new Set<string>();
    for (const e of tickets) for (const f of e.features) set.add(f);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tickets]);
  const categoryPool = useMemo(() => poolOf(tickets, (e) => e.category), [tickets]);
  const venuePool = useMemo(() => poolOf(tickets, (e) => e.venue), [tickets]);

  const eventsFilter = toEventsFilter(filter);
  const filterActive = !isEventsFilterEmpty(eventsFilter);

  // Tickets del día seleccionado: búsqueda por título + filtro + orden por hora.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byDay = tickets.filter((t) => t.date === selectedDate);
    const byQuery = q ? byDay.filter((t) => t.title.toLowerCase().includes(q)) : byDay;
    return sortEvents(applyEventsFilters(byQuery, eventsFilter), 'date') as TicketableEvent[];
  }, [tickets, selectedDate, query, eventsFilter]);

  const filterTexts: FilterTexts = {
    title: texts.filters.title,
    features: texts.filters.features,
    category: texts.filters.category,
    venue: texts.filters.venue,
    priceRange: texts.filters.priceRange,
    free: texts.filters.free,
    clearAll: texts.filters.clearAll,
    apply: texts.filters.apply,
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand: avatar + buscador + inbox */}
      <div
        className="flex shrink-0 items-center gap-2.5 px-3 pb-2.5 pt-11"
        style={{ backgroundColor: BRAND }}
      >
        <button
          type="button"
          aria-label="Profile"
          onClick={() => router.push('/pwa/profile')}
          className="shrink-0 text-white"
        >
          <ProfileIcon size={26} />
        </button>
        <div
          className="flex h-10 flex-1 items-center gap-2 rounded-full px-[14px] text-white"
          style={{ backgroundColor: 'hsl(0 0% 100% / 0.25)' }}
        >
          <SearchIcon size={15} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={texts.searchPlaceholder}
            className="h-full flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/70"
            style={{ fontFamily: OPEN_SANS }}
          />
          {query.trim() ? (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setQuery('')}
              className="text-xl leading-none text-white/70"
            >
              ×
            </button>
          ) : null}
        </div>
        <SavedTripButton size={24} className="shrink-0" />
      </div>

      {/* Sub-fila: título + ubicación + filtro (fondo brand-primary, continúa el header) */}
      <div
        className="flex shrink-0 items-start justify-between px-4 pb-3 pt-3"
        style={{ backgroundColor: BRAND }}
      >
        <div className="min-w-0">
          <h1 className="font-bold text-white" style={{ fontSize: 22, fontFamily: OPEN_SANS }}>
            {texts.title}
          </h1>
          <div className="mt-1 flex items-center gap-1.5">
            <svg width={11} height={14} viewBox="0 0 384 512" fill={PIN} aria-hidden>
              <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
            </svg>
            <span
              className="truncate"
              style={{ fontSize: 12, color: 'hsl(0 0% 100% / 0.8)', fontFamily: OPEN_SANS }}
            >
              {texts.locationLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Filter"
          onClick={() => setFilterOpen(true)}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: PWA }}
        >
          {filterActive && (
            <span
              className="absolute rounded-full"
              style={{
                right: 0,
                top: 0,
                width: 9,
                height: 9,
                backgroundColor: 'hsl(var(--pwa-favorite))',
                border: '1.5px solid hsl(var(--background))',
              }}
            />
          )}
          <svg width={18} height={15.5} viewBox="0 0 28 24" fill="currentColor" aria-hidden>
            <g transform="translate(-2 -4)">
              <path d="M2,7A1,1,0,0,1,3,6H20.184a2.982,2.982,0,0,1,5.632,0H29a1,1,0,0,1,0,2H25.816a2.982,2.982,0,0,1-5.632,0H3A1,1,0,0,1,2,7Zm27,8H14.816a2.982,2.982,0,0,0-5.632,0H3a1,1,0,0,0,0,2H9.184a2.982,2.982,0,0,0,5.632,0H29a1,1,0,0,0,0-2Zm0,9H25.816a2.982,2.982,0,0,0-5.632,0H3a1,1,0,0,0,0,2H20.184a2.982,2.982,0,0,0,5.632,0H29a1,1,0,0,0,0-2Z" />
            </g>
          </svg>
        </button>
      </div>

      {/* Selector de día */}
      <PwaWeekPicker
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onPrevWeek={() => setSelectedDate((d) => addWeeks(d, -1))}
        onNextWeek={() => setSelectedDate((d) => addWeeks(d, 1))}
      />

      {/* Cuerpo: timeline horaria del día */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {visible.length === 0 ? (
          <p
            className="px-6 py-16 text-center"
            style={{ fontSize: 14, color: 'hsl(var(--foreground) / 0.6)', fontFamily: OPEN_SANS }}
          >
            {texts.emptyState}
          </p>
        ) : (
          <ul className="pb-4 pt-[11px]">
            {visible.map((event, i) => {
              const isFirst = i === 0;
              const isLast = i === visible.length - 1;
              const [time, ampm] = formatTime12(event.startTime).split(' ');
              return (
                <li key={event.slug} className="flex gap-2 px-4">
                  {/* Rail izquierdo: hora + línea + dot */}
                  <div className="relative w-[52px] shrink-0">
                    <span
                      className="absolute"
                      style={{
                        left: 48,
                        top: isFirst ? 18 : 0,
                        bottom: isLast ? 'auto' : 0,
                        height: isLast ? 18 : undefined,
                        width: 2,
                        backgroundColor: LINE,
                      }}
                    />
                    <span
                      className="absolute rounded-full"
                      style={{
                        left: 43,
                        top: 13,
                        width: 11,
                        height: 11,
                        backgroundColor: BRAND,
                        border: '2px solid hsl(var(--background))',
                      }}
                    />
                    <div className="pt-1 text-right" style={{ paddingRight: 14 }}>
                      <div
                        className="font-bold leading-none"
                        style={{ fontSize: 16, color: BRAND, fontFamily: OPEN_SANS }}
                      >
                        {time}
                      </div>
                      <div
                        className="font-bold uppercase leading-none"
                        style={{ fontSize: 11, color: BRAND, fontFamily: OPEN_SANS, marginTop: 2 }}
                      >
                        {ampm}
                      </div>
                    </div>
                  </div>

                  {/* Card del ticket */}
                  <div
                    className={`min-w-0 flex-1 ${isLast ? '' : 'border-b'} pb-5 pt-1`}
                    style={isLast ? undefined : { borderColor: 'hsl(var(--foreground) / 0.1)' }}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/pwa/tickets/${event.slug}`)}
                      className="block w-full text-left"
                    >
                      <span
                        className="block font-bold text-foreground"
                        style={{ fontSize: 17, fontFamily: OPEN_SANS }}
                      >
                        {event.title}
                      </span>
                      <span
                        className="relative mt-1.5 block w-full overflow-hidden rounded-[8px] bg-cover bg-center"
                        style={{
                          height: 130,
                          backgroundImage: `url("${resolveAssetUrl(event.image)}")`,
                        }}
                      >
                        {/* Badge de precio */}
                        <span
                          className="absolute font-bold text-white"
                          style={{
                            top: 8,
                            right: 8,
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: PWA,
                            fontSize: 12.5,
                            fontFamily: OPEN_SANS,
                          }}
                        >
                          {event.ticket.priceDisplay}
                        </span>
                      </span>
                      <span
                        className="mt-2 block"
                        style={{
                          fontSize: 12.5,
                          color: 'hsl(var(--foreground) / 0.55)',
                          fontFamily: OPEN_SANS,
                        }}
                      >
                        {event.venue}
                      </span>
                    </button>
                    <div className="mt-2.5 flex items-center gap-5" style={{ color: PWA }}>
                      <ShareIconButton
                        size={18}
                        onShare={() =>
                          pwaShare({
                            title: event.title,
                            text: event.title,
                            url: event.ticket.purchaseUrl,
                          })
                        }
                      />
                      <button
                        type="button"
                        aria-label="Favorite"
                        onClick={() => toggleFav(event.slug)}
                      >
                        <PwaHeart filled={isFavorited(event.slug)} size={20} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <PwaBottomNav />

      <PwaFilterOverlay
        open={filterOpen}
        features={featurePool}
        subcategories={categoryPool}
        venues={venuePool}
        initial={filter}
        texts={filterTexts}
        onCancel={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilter(next);
          setFilterOpen(false);
        }}
      />
    </div>
  );
}
