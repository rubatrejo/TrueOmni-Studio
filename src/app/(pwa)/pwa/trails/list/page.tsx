import { type ListingItem } from '@/components/pwa/listings-list-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { TrailsListScreenLive } from '@/components/pwa/trails-list-screen-live';
import { getConfig } from '@/lib/config';
import { isTrailsModule } from '@/lib/itinerary-tabs';
import { haversineMi } from '@/lib/listings-sort';
import type { MapItem } from '@/lib/map-item';
import { trailToPwaListing } from '@/lib/trails';

export const dynamic = 'force-dynamic';

/**
 * Trails — lista (#2) + mapa (#3, tab). La data viene del kiosk
 * (`home.modules.trails`, `kind: 'trails'`); se adapta cada `Trail` a `Listing`
 * (`trailToPwaListing`, que pobla difficulty/trailType) para reutilizar
 * `ListingsListScreen` y su filtro. `cat` solo cambia el título (como el resto de
 * list pages). Textos desde `config.features.pwa.trails`.
 */
export default async function PwaTrailsListPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const config = await getConfig();
  const t = config.features?.pwa?.trails;
  const mod = config.features?.home?.modules?.trails;
  const origin = config.client?.coords;

  if (!t || !mod || !isTrailsModule(mod)) {
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

  // Listings crudos (con difficulty/trailType) para `applyFilters`.
  const listings = mod.trails.map((tr) => trailToPwaListing(tr));

  const items: ListingItem[] = mod.trails.map((tr) => ({
    slug: tr.slug,
    title: tr.title,
    subcategory: tr.subcategory,
    image: tr.image,
    coords: tr.coords,
    distanceMi: origin ? haversineMi(origin, tr.coords) : 0,
    cityState: cityStateOf(tr.address),
    openUntil: '',
  }));

  // MapItems para `MapCanvas` (pin/color/ícono canónico de la source 'trails').
  const mapItems: MapItem[] = mod.trails.map((tr) => ({
    source: 'trails',
    moduleSlug: 'trails',
    slug: tr.slug,
    title: tr.title,
    subcategory: tr.subcategory,
    image: tr.image,
    coords: tr.coords,
    address: tr.address,
    phone: tr.phone,
    features: tr.features,
    popularity: tr.popularity,
    hours: tr.hours,
  }));

  return (
    <MobileCanvas>
      <TrailsListScreenLive
        config={t}
        categoryKey={cat}
        items={items}
        mapItems={mapItems}
        listings={listings}
        features={mod.features}
        subcategories={[]}
        difficulties={mod.difficulties}
        trailTypes={mod.trailTypes}
        origin={origin}
        mapboxToken={config.integraciones?.mapbox_token}
        basePath="/pwa/trails"
      />
    </MobileCanvas>
  );
}
