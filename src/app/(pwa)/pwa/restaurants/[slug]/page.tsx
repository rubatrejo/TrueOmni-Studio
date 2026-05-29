import { notFound } from 'next/navigation';

import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { RestaurantsDetailScreen } from '@/components/pwa/restaurants-detail-screen';
import { getConfig } from '@/lib/config';
import { isListingsModule } from '@/lib/itinerary-tabs';

export const dynamic = 'force-dynamic';

/**
 * Restaurants — detalle (#4–#7, #10) + popups menú (#9) y horarios (#11).
 * La data del restaurante viene del kiosk (`home.modules.restaurants.listings`);
 * los textos desde `config.features.pwa.restaurants`.
 */
export default async function PwaRestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getConfig();
  const r = config.features?.pwa?.restaurants;
  const mod = config.features?.home?.modules?.restaurants;
  if (!r || !mod || !isListingsModule(mod)) notFound();

  const l = mod.listings.find((x) => x.slug === slug);
  if (!l) notFound();

  return (
    <MobileCanvas>
      <RestaurantsDetailScreen
        detail={{
          slug: l.slug,
          title: l.title,
          image: l.image,
          address: l.address,
          phone: l.phone,
          website: l.website,
          description: l.description,
          coords: l.coords,
          openHours: l.openHours,
          menuImage: l.menuImage,
          diningGuideUrl: l.diningGuideUrl,
          gallery: l.gallery,
        }}
        texts={{
          headerTitle: r.title,
          eyebrow: r.detail.eyebrow,
          call: r.detail.call,
          website: r.detail.website,
          addFavorite: r.detail.addFavorite,
          removeFavorite: r.detail.removeFavorite,
          menu: r.detail.menu,
          seeDirections: r.detail.seeDirections,
          description: r.detail.description,
          openNowUntil: r.detail.openNowUntil,
          moreHours: r.detail.moreHours,
          openDiningGuide: r.detail.openDiningGuide,
          businessHours: r.businessHours,
          menuClose: r.menu.close,
        }}
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
