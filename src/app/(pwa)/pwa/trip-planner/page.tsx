import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { openUntilLabel } from '@/components/pwa/trip-planner/open-until';
import { TripPlannerLive } from '@/components/pwa/trip-planner/trip-planner-live';
import type { TpCard, TpCategory, TpLocalListing } from '@/components/pwa/trip-planner/types';
import { getConfig } from '@/lib/config';
import {
  distanceMi,
  getItineraryCatalogAll,
  getItineraryCatalogForModule,
  type ItineraryCatalogItem,
} from '@/lib/itinerary-catalog';

export const dynamic = 'force-dynamic';

/** Categorías del menú → módulo de origen del catálogo. */
const MENU_MODULES = [
  { key: 'things-to-do', menuKey: 'thingsToDo' as const },
  { key: 'restaurants', menuKey: 'restaurants' as const },
  { key: 'events', menuKey: 'events' as const },
];

export default async function PwaTripPlannerPage() {
  const config = await getConfig();
  const itinerary = config.features?.home?.itinerary;
  const tp = config.features?.pwa?.tripPlanner;

  if (!itinerary || !itinerary.enabled || !tp) {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center px-8 text-center text-foreground">
          {config.textos.itinerary_disabled ?? 'Trip Planner is not configured for this client.'}
        </div>
      </MobileCanvas>
    );
  }

  const origin = config.client.coords ?? { lat: 0, lng: 0 };

  const toCard = (it: ItineraryCatalogItem): TpCard => ({
    slug: it.slug,
    kind: it.kind,
    moduleSlug: it.moduleSlug,
    title: it.title,
    subcategory: it.subcategory,
    image: it.image,
    coords: it.coords,
    address: it.address,
    distanceMi: distanceMi(origin, it.coords),
    openUntil: openUntilLabel(tp.openUntilPrefix, it.hours, it.endTime),
    date: it.date,
  });

  const categories: TpCategory[] = MENU_MODULES.map(({ key, menuKey }) => ({
    key,
    label: tp.menu[menuKey],
    items: getItineraryCatalogForModule(config, key).map(toCard),
  }));

  // Catálogo completo (para el generador AI) + cards de stay (tab LODGING).
  const catalogAll = getItineraryCatalogAll(config);
  const stayCards: TpCard[] = getItineraryCatalogForModule(config, 'stay').map(toCard);

  // Local Listings: collage + distancia/horario del primer stop (estilo del diseño).
  const itemByKey = new Map<string, ItineraryCatalogItem>();
  for (const it of catalogAll) itemByKey.set(`${it.kind}:${it.slug}`, it);
  const localListings: TpLocalListing[] = itinerary.local_listings.map((ll) => {
    const stopItems = ll.stops
      .map((s) => itemByKey.get(`${s.kind}:${s.slug}`))
      .filter((x): x is ItineraryCatalogItem => Boolean(x));
    const images = stopItems.slice(0, 3).map((it) => it.image);
    const first = stopItems[0];
    return {
      slug: ll.slug,
      title: ll.title,
      images: images.length > 0 ? images : [ll.image],
      stopCount: ll.stops.length,
      distanceMi: first ? distanceMi(origin, first.coords) : 0,
      openUntil: first ? openUntilLabel(tp.openUntilPrefix, first.hours, first.endTime) : '',
      stops: ll.stops.map((s) => ({ slug: s.slug, kind: s.kind })),
    };
  });

  return (
    <MobileCanvas>
      <TripPlannerLive
        tp={tp}
        categories={categories}
        localListings={localListings}
        catalog={catalogAll}
        stayCards={stayCards}
        textos={config.textos}
        clientName={config.client.nombre}
        clientCoords={origin}
        mapboxToken={config.integraciones?.mapbox_token ?? ''}
        ai={itinerary.ai}
      />
    </MobileCanvas>
  );
}
