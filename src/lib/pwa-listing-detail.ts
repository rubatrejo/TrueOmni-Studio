import type {
  HeroPrimaryAction,
  ListingDetail,
  ListingDetailTexts,
} from '@/components/pwa/listings-detail-screen';
import type { ConsiderationsLabels } from '@/components/pwa/pwa-considerations';
import type { PwaTrailMapData } from '@/components/pwa/pwa-trail-map';
import type {
  KioskConfig,
  PwaConfig,
  PwaListingsModuleConfig,
  TrailConsiderations,
} from '@/lib/config';
import { formatDayLabel, formatEventDateLong, formatTimeRange } from '@/lib/events-date';
import { isListingsModule, isTrailsModule } from '@/lib/itinerary-tabs';

export interface PwaListingDetailData {
  detail: ListingDetail;
  texts: ListingDetailTexts;
  heroPrimaryAction: HeroPrimaryAction;
  /** Panel "Considerations" — solo Trails. */
  considerations?: { data: TrailConsiderations; labels: ConsiderationsLabels };
  /** Mapa de 2 tabs (mapa / ruta GeoJSON) — solo Trails. */
  trailMap?: { data: PwaTrailMapData; defaultLabel: string; trailLabel: string };
}

/** `home.modules` usa "things-to-do"; `features.pwa` usa "thingsToDo". */
const PWA_KEY: Record<string, keyof PwaConfig> = {
  restaurants: 'restaurants',
  stay: 'stay',
  'things-to-do': 'thingsToDo',
  events: 'events',
};

/**
 * Caso especial Events: el módulo es `kind: 'events'` (no listings) y su config
 * tiene un shape propio (`PwaEventsModuleConfig`). Reutiliza la misma pantalla de
 * detalle adaptando `EventItem` → `ListingDetail` con una fila de fecha/hora
 * (`eventWhen`) y el botón GET TICKETS si el evento vende boletos. Sin `openHours`
 * → la fila de horario y el modal de Business Hours no se renderizan.
 */
function buildEventDetail(config: KioskConfig, slug: string): PwaListingDetailData | null {
  const mod = config.features?.home?.modules?.events;
  const cfg = config.features?.pwa?.events;
  if (!mod || mod.kind !== 'events' || !cfg) return null;

  const e = mod.events.find((x) => x.slug === slug);
  if (!e) return null;

  const detail: ListingDetail = {
    slug: e.slug,
    title: e.title,
    image: e.image,
    address: e.address,
    phone: e.phone,
    website: e.website,
    description: e.description,
    coords: e.coords,
    eventWhen: {
      dateLabel: `${formatDayLabel(e.date).weekdayLong}, ${formatEventDateLong(e.date)}`,
      timeLabel: formatTimeRange(e.startTime, e.endTime),
    },
  };

  const texts: ListingDetailTexts = {
    headerTitle: cfg.title,
    eyebrow: cfg.detail.eyebrow,
    call: cfg.detail.call,
    website: cfg.detail.website,
    addFavorite: cfg.detail.addFavorite,
    removeFavorite: cfg.detail.removeFavorite,
    seeDirections: cfg.detail.seeDirections,
    description: cfg.detail.description,
    // Events no tiene horario; estos campos quedan sin uso (no se renderizan).
    openNowUntil: '',
    moreHours: '',
    businessHours: { title: '', close: '', days: [] },
  };

  const heroPrimaryAction: HeroPrimaryAction =
    e.ticketsUrl && cfg.detail.getTickets
      ? { kind: 'external-link', label: cfg.detail.getTickets, url: e.ticketsUrl }
      : { kind: 'none' };

  return { detail, texts, heroPrimaryAction };
}

/**
 * Caso especial Tickets: Tickets ⊂ Events. Reutiliza el pool de `home.modules.events`
 * (solo los `EventItem` con campo `ticket`) y la misma pantalla de detalle que Events,
 * pero el CTA del hero es "BUY TICKET · {precio}" (abre `ticket.purchaseUrl`) en vez
 * de "GET TICKETS". Textos desde `features.pwa.tickets`.
 */
function buildTicketDetail(config: KioskConfig, slug: string): PwaListingDetailData | null {
  const mod = config.features?.home?.modules?.events;
  const cfg = config.features?.pwa?.tickets;
  if (!mod || mod.kind !== 'events' || !cfg) return null;

  const e = mod.events.find((x) => x.slug === slug);
  if (!e || !e.ticket) return null;

  const detail: ListingDetail = {
    slug: e.slug,
    title: e.title,
    image: e.image,
    address: e.address,
    phone: e.phone,
    website: e.website,
    description: e.description,
    coords: e.coords,
    eventWhen: {
      dateLabel: `${formatDayLabel(e.date).weekdayLong}, ${formatEventDateLong(e.date)}`,
      timeLabel: formatTimeRange(e.startTime, e.endTime),
    },
  };

  const texts: ListingDetailTexts = {
    headerTitle: cfg.title,
    eyebrow: cfg.detail.eyebrow,
    call: cfg.detail.call,
    website: cfg.detail.website,
    addFavorite: cfg.detail.addFavorite,
    removeFavorite: cfg.detail.removeFavorite,
    seeDirections: cfg.detail.seeDirections,
    description: cfg.detail.description,
    openNowUntil: '',
    moreHours: '',
    businessHours: { title: '', close: '', days: [] },
  };

  const heroPrimaryAction: HeroPrimaryAction = {
    kind: 'external-link',
    label: `${cfg.detail.buyTicket} · ${e.ticket.priceDisplay}`,
    url: e.ticket.purchaseUrl,
  };

  return { detail, texts, heroPrimaryAction };
}

/**
 * Caso especial Trails: el módulo es `kind: 'trails'` (no listings). Reutiliza la
 * pantalla de detalle de listings añadiendo el panel "Considerations" y el mapa de
 * 2 tabs (mapa normal / ruta GeoJSON). Sin `openHours` ni acción de hero.
 */
function buildTrailDetail(config: KioskConfig, slug: string): PwaListingDetailData | null {
  const mod = config.features?.home?.modules?.trails;
  const cfg = config.features?.pwa?.trails;
  if (!mod || !isTrailsModule(mod) || !cfg) return null;

  const t = mod.trails.find((x) => x.slug === slug);
  if (!t) return null;

  const detail: ListingDetail = {
    slug: t.slug,
    title: t.title,
    image: t.image,
    address: t.address,
    phone: t.phone,
    website: t.website,
    description: t.description,
    coords: t.coords,
  };

  const texts: ListingDetailTexts = {
    headerTitle: cfg.title,
    eyebrow: cfg.detail.eyebrow,
    call: cfg.detail.call,
    website: cfg.detail.website,
    addFavorite: cfg.detail.addFavorite,
    removeFavorite: cfg.detail.removeFavorite,
    seeDirections: cfg.detail.seeDirections,
    description: cfg.detail.description,
    // Trails no usa horario.
    openNowUntil: '',
    moreHours: '',
    businessHours: { title: '', close: '', days: [] },
  };

  return {
    detail,
    texts,
    heroPrimaryAction: { kind: 'none' },
    considerations: { data: t.considerations, labels: cfg.detail.considerations },
    trailMap: {
      data: {
        coords: t.coords,
        geojson: t.trailMap.geojson,
        defaultCenter: t.trailMap.defaultCenter,
        defaultZoom: t.trailMap.defaultZoom,
      },
      defaultLabel: cfg.detail.mapTabs.default,
      trailLabel: cfg.detail.mapTabs.trail,
    },
  };
}

/**
 * Construye `{ detail, texts, heroPrimaryAction }` de un listing de un módulo dado,
 * reutilizando la misma lógica que los detail pages de cada módulo. Usado por el
 * detalle del módulo Maps (`/pwa/map/[module]/[slug]`) para no duplicar el armado.
 * Devuelve `null` si el módulo/slug no existe o no es un módulo de listings.
 *
 * La acción del hero depende del módulo: restaurants → popup de menú; stay → "BOOK
 * NOW" externo; el resto → sin botón. Al sumar Events/Trails, ampliar este switch.
 */
export function buildPwaListingDetail(
  config: KioskConfig,
  moduleSlug: string,
  slug: string,
): PwaListingDetailData | null {
  // Events, Tickets y Trails no son módulos de listings → ramas propias (antes del guard).
  if (moduleSlug === 'events') return buildEventDetail(config, slug);
  if (moduleSlug === 'tickets') return buildTicketDetail(config, slug);
  if (moduleSlug === 'trails') return buildTrailDetail(config, slug);

  const mod = config.features?.home?.modules?.[moduleSlug];
  const pwaKey = PWA_KEY[moduleSlug];
  const cfg = pwaKey
    ? (config.features?.pwa?.[pwaKey] as PwaListingsModuleConfig | undefined)
    : undefined;
  if (!mod || !cfg || !isListingsModule(mod)) return null;

  const l = mod.listings.find((x) => x.slug === slug);
  if (!l) return null;

  const detail: ListingDetail = {
    slug: l.slug,
    title: l.title,
    image: l.image,
    address: l.address,
    phone: l.phone,
    website: l.website,
    description: l.description,
    coords: l.coords,
    openHours: l.openHours,
    diningGuideUrl: l.diningGuideUrl,
    gallery: l.gallery,
  };

  const texts: ListingDetailTexts = {
    headerTitle: cfg.title,
    eyebrow: cfg.detail.eyebrow,
    call: cfg.detail.call,
    website: cfg.detail.website,
    addFavorite: cfg.detail.addFavorite,
    removeFavorite: cfg.detail.removeFavorite,
    seeDirections: cfg.detail.seeDirections,
    description: cfg.detail.description,
    openNowUntil: cfg.detail.openNowUntil,
    moreHours: cfg.detail.moreHours,
    openDiningGuide: cfg.detail.openDiningGuide,
    businessHours: cfg.businessHours,
  };

  let heroPrimaryAction: HeroPrimaryAction = { kind: 'none' };
  if (moduleSlug === 'restaurants' && l.menuImage && cfg.detail.menu && cfg.menu) {
    heroPrimaryAction = {
      kind: 'image-popup',
      label: cfg.detail.menu,
      image: l.menuImage,
      closeLabel: cfg.menu.close,
    };
  } else if (moduleSlug === 'stay') {
    const bookUrl = l.reserveUrl ?? l.website;
    if (bookUrl && cfg.detail.bookNow) {
      heroPrimaryAction = { kind: 'external-link', label: cfg.detail.bookNow, url: bookUrl };
    }
  }

  return { detail, texts, heroPrimaryAction };
}
