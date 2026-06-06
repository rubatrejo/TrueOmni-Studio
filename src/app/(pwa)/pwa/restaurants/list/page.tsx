import { type ListingItem } from '@/components/pwa/listings-list-screen';
import { ListingsListScreenLive } from '@/components/pwa/listings-list-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';
import { isListingsModule } from '@/lib/itinerary-tabs';
import { haversineMi } from '@/lib/listings-sort';
import type { MapItem } from '@/lib/map-item';

export const dynamic = 'force-dynamic';

/**
 * Restaurants — lista (#2) + mapa (#3, tab). Reutiliza los listings del kiosk
 * (`home.modules.restaurants.listings`); la distancia se calcula desde las coords
 * del cliente. Textos desde `config.features.pwa.restaurants`.
 */
export default async function PwaRestaurantsListPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const config = await getConfig();
  const r = config.features?.pwa?.restaurants;
  const mod = config.features?.home?.modules?.restaurants;
  const origin = config.client?.coords;

  if (!r || !mod || !isListingsModule(mod)) {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  const cityStateOf = (address: string) => {
    const city = address.split(',').slice(-2, -1)[0]?.trim() ?? '';
    const st = address.match(/,\s*([A-Z]{2})\b/)?.[1] ?? '';
    return [city, st].filter(Boolean).join(', ');
  };

  const items: ListingItem[] = mod.listings.map((l) => ({
    slug: l.slug,
    title: l.title,
    subcategory: l.subcategory,
    image: l.image,
    coords: l.coords,
    distanceMi: origin ? haversineMi(origin, l.coords) : 0,
    cityState: cityStateOf(l.address),
    openUntil: `${r.openUntilPrefix} ${l.hours.split('–')[1]?.trim() ?? l.hours}`,
  }));

  // MapItems para `MapCanvas` (pines del kiosk). Source 'restaurants' → pin/color/ícono del kiosk.
  const mapItems: MapItem[] = mod.listings.map((l) => ({
    source: 'restaurants',
    moduleSlug: 'restaurants',
    slug: l.slug,
    title: l.title,
    subcategory: l.subcategory,
    image: l.image,
    coords: l.coords,
    address: l.address,
    phone: l.phone,
    features: l.features,
    popularity: l.popularity,
    hours: l.hours,
    priceRange: l.priceRange,
  }));

  return (
    <MobileCanvas>
      <ListingsListScreenLive
        moduleKey="restaurants"
        config={r}
        categoryKey={cat}
        items={items}
        mapItems={mapItems}
        listings={mod.listings}
        features={mod.features}
        subcategories={mod.subcategories}
        origin={origin}
        mapboxToken={config.integraciones?.mapbox_token}
        basePath="/pwa/restaurants"
        navActive="dining"
      />
    </MobileCanvas>
  );
}
