import { notFound } from 'next/navigation';

import { ListingsDetailScreenLive } from '@/components/pwa/listings-detail-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
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
      <ListingsDetailScreenLive
        moduleKey="restaurants"
        config={r}
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
          diningGuideUrl: l.diningGuideUrl,
          gallery: l.gallery,
        }}
        heroPrimaryAction={
          l.menuImage && r.detail.menu && r.menu
            ? {
                kind: 'image-popup',
                label: r.detail.menu,
                image: l.menuImage,
                closeLabel: r.menu.close,
              }
            : { kind: 'none' }
        }
        basePath="/pwa/restaurants"
        navActive="dining"
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
