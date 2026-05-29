import { ListingsListScreen, type ListingItem } from '@/components/pwa/listings-list-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';
import { isListingsModule } from '@/lib/itinerary-tabs';
import { haversineMi } from '@/lib/listings-sort';
import type { MapItem } from '@/lib/map-item';

export const dynamic = 'force-dynamic';

/**
 * Places to Stay — lista (#2) + mapa (#3, tab). Reutiliza los listings del kiosk
 * (`home.modules.stay.listings`); la distancia se calcula desde las coords del
 * cliente. Textos desde `config.features.pwa.stay`.
 */
export default async function PwaStayListPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const config = await getConfig();
  const s = config.features?.pwa?.stay;
  const mod = config.features?.home?.modules?.stay;
  const origin = config.client?.coords;

  if (!s || !mod || !isListingsModule(mod)) {
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
    openUntil: `${s.openUntilPrefix} ${l.hours.split('–')[1]?.trim() ?? l.hours}`,
  }));

  // MapItems para `MapCanvas` (pines del kiosk). Source 'stay' → pin/color/ícono del kiosk.
  const mapItems: MapItem[] = mod.listings.map((l) => ({
    source: 'stay',
    moduleSlug: 'stay',
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

  const categoryLabel = cat ? s.categories.find((c) => c.key === cat)?.label : undefined;

  return (
    <MobileCanvas>
      <ListingsListScreen
        title={categoryLabel ?? s.title}
        tabs={s.tabs}
        resultsLabel={s.resultsLabel}
        distanceSuffix={s.distanceSuffix}
        items={items}
        mapItems={mapItems}
        listings={mod.listings}
        features={mod.features}
        subcategories={mod.subcategories}
        filterTexts={s.filters}
        origin={origin}
        mapboxToken={config.integraciones?.mapbox_token}
        basePath="/pwa/stay"
      />
    </MobileCanvas>
  );
}
