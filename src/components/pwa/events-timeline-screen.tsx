'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { EventItem, PwaEventsModuleConfig } from '@/lib/config';
import { formatEventCardWhen, formatTimelineDate } from '@/lib/events-date';
import {
  applyEventsFilters,
  isEventsFilterEmpty,
  type EventsFilterState,
} from '@/lib/events-filter';
import { useEventFavorites } from '@/lib/favorites';
import { EMPTY_FILTER, type FilterState } from '@/lib/listings-filter';
import { pwaShare } from '@/lib/pwa-share';

import { PwaBottomNav } from './bottom-nav';
import { NotificationIcon, ProfileIcon, SearchIcon } from './dashboard-icons';
import { PwaFilterOverlay, type FilterTexts } from './pwa-filter-overlay';
import { PwaHeart } from './pwa-heart';
import { ShareIconButton } from './share-icon-button';

const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const PIN = 'hsl(var(--pwa-events-pin))';
const LINE = 'hsl(var(--brand-primary) / 0.25)';
const OPEN_SANS = 'var(--font-open-sans)';

/** Pool ordenado de valores únicos de un campo de los eventos. */
function poolOf(events: readonly EventItem[], pick: (e: EventItem) => string): string[] {
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

/** Fila de la timeline ya aplanada (un evento), con flags de layout. */
interface Row {
  event: EventItem;
  /** Marca el primer evento de su día → muestra el marcador de fecha. */
  showDate: boolean;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Events #1 — timeline cronológica (`/pwa/events`). Pantalla primaria del bottom
 * nav (celda `events`). Header propio estilo Dashboard (avatar + buscador "Search
 * in your city" + inbox); el buscador **filtra la timeline por título**. Bajo el
 * header, el título "Events" + pin de ubicación + botón de filtro (mismo overlay
 * que listings/Maps, con secciones Venue + Free). El cuerpo es una línea de tiempo
 * con eventos agrupados por día; cada card tiene share (Web Share) y favorito
 * (client-side). El detalle se abre en `/pwa/events/[slug]`.
 *
 * White-label: textos desde `config.features.pwa.events`; data desde el kiosk
 * (`home.modules.events`). La data llega ya ordenada por fecha (asc) desde la page.
 */
export function EventsTimelineScreen({
  texts,
  events,
}: {
  texts: PwaEventsModuleConfig;
  events: EventItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  // Favoritos de eventos persistentes (sessionStorage, compartido con el kiosk) — C3.
  const { isFavorited, toggle: toggleFav } = useEventFavorites();
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);

  // Pools del overlay (derivados de los eventos reales).
  const featurePool = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) for (const f of e.features) set.add(f);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [events]);
  const categoryPool = useMemo(() => poolOf(events, (e) => e.category), [events]);
  const venuePool = useMemo(() => poolOf(events, (e) => e.venue), [events]);

  // Búsqueda por título + filtro de eventos (overlay → EventsFilterState).
  const eventsFilter = toEventsFilter(filter);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byQuery = q ? events.filter((e) => e.title.toLowerCase().includes(q)) : events;
    return applyEventsFilters(byQuery, eventsFilter);
  }, [events, query, eventsFilter]);

  const filterActive = !isEventsFilterEmpty(eventsFilter);

  // Aplana en filas con flags de día/primero/último para la línea de tiempo.
  const rows: Row[] = useMemo(() => {
    return visible.map((event, i) => ({
      event,
      showDate: i === 0 || visible[i - 1].date !== event.date,
      isFirst: i === 0,
      isLast: i === visible.length - 1,
    }));
  }, [visible]);

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
        <button
          type="button"
          aria-label="Inbox"
          onClick={() => router.push('/pwa/notifications')}
          className="shrink-0 text-white"
        >
          <NotificationIcon size={24} />
        </button>
      </div>

      {/* Sub-fila: título + ubicación + filtro */}
      <div className="flex shrink-0 items-start justify-between px-4 pb-3 pt-3">
        <div className="min-w-0">
          <h1 className="font-bold" style={{ fontSize: 22, color: PWA, fontFamily: OPEN_SANS }}>
            {texts.title}
          </h1>
          <div className="mt-1 flex items-center gap-1.5">
            <svg width={11} height={14} viewBox="0 0 384 512" fill={PIN} aria-hidden>
              <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
            </svg>
            <span
              className="truncate"
              style={{
                fontSize: 12,
                color: 'hsl(var(--foreground) / 0.55)',
                fontFamily: OPEN_SANS,
              }}
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

      {/* Cuerpo: timeline */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {rows.length === 0 ? (
          <p
            className="px-6 py-16 text-center"
            style={{ fontSize: 14, color: 'hsl(var(--foreground) / 0.6)', fontFamily: OPEN_SANS }}
          >
            {texts.emptyState}
          </p>
        ) : (
          <ul className="pb-4">
            {rows.map(({ event, showDate, isFirst, isLast }) => {
              const marker = formatTimelineDate(event.date);
              return (
                <li key={event.slug} className="flex gap-2 px-4">
                  {/* Rail izquierdo: fecha + línea + dot */}
                  <div className="relative w-[46px] shrink-0">
                    {/* línea vertical (continua entre filas) */}
                    <span
                      className="absolute"
                      style={{
                        left: 42,
                        top: isFirst ? 18 : 0,
                        bottom: isLast ? 'auto' : 0,
                        height: isLast ? 18 : undefined,
                        width: 2,
                        backgroundColor: LINE,
                      }}
                    />
                    {/* dot alineado al título */}
                    <span
                      className="absolute rounded-full"
                      style={{
                        left: 37,
                        top: 13,
                        width: 11,
                        height: 11,
                        backgroundColor: BRAND,
                        border: '2px solid hsl(var(--background))',
                      }}
                    />
                    {showDate && (
                      <div className="pt-1 text-right" style={{ paddingRight: 14 }}>
                        <div
                          className="font-bold leading-none"
                          style={{ fontSize: 20, color: BRAND, fontFamily: OPEN_SANS }}
                        >
                          {marker.day}
                        </div>
                        <div
                          className="font-bold leading-none"
                          style={{ fontSize: 13, color: BRAND, fontFamily: OPEN_SANS }}
                        >
                          {marker.monthShort}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card del evento */}
                  <div
                    className={`min-w-0 flex-1 ${isLast ? '' : 'border-b'} pb-5 pt-1`}
                    style={isLast ? undefined : { borderColor: 'hsl(var(--foreground) / 0.1)' }}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/pwa/events/${event.slug}`)}
                      className="block w-full text-left"
                    >
                      <span
                        className="block font-bold text-foreground"
                        style={{ fontSize: 17, fontFamily: OPEN_SANS }}
                      >
                        {event.title}
                      </span>
                      <span
                        className="mt-1.5 block w-full overflow-hidden rounded-[8px] bg-cover bg-center"
                        style={{
                          height: 130,
                          backgroundImage: `url("${resolveAssetUrl(event.image)}")`,
                        }}
                      />
                      <span
                        className="mt-2 block"
                        style={{
                          fontSize: 12.5,
                          color: 'hsl(var(--foreground) / 0.55)',
                          fontFamily: OPEN_SANS,
                        }}
                      >
                        {formatEventCardWhen(event.date, event.startTime)}
                      </span>
                    </button>
                    <div className="mt-2.5 flex items-center gap-5" style={{ color: PWA }}>
                      <ShareIconButton
                        size={18}
                        onShare={() =>
                          pwaShare({
                            title: event.title,
                            text: event.title,
                            url: event.ticketsUrl ?? event.website,
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

      <PwaBottomNav active="events" />

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
