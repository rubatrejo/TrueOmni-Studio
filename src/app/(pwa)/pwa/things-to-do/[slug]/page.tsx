import { notFound } from 'next/navigation';

import { ListingsDetailScreen } from '@/components/pwa/listings-detail-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';
import { isListingsModule } from '@/lib/itinerary-tabs';

export const dynamic = 'force-dynamic';

/**
 * Things to Do — detalle (#4–#7, #10) + popups galería (#6) y horarios (#11).
 * La data del lugar viene del kiosk (`home.modules['things-to-do'].listings`); los
 * textos desde `config.features.pwa.thingsToDo`. Sin botón especial en el hero.
 */
export default async function PwaThingsToDoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getConfig();
  const t = config.features?.pwa?.thingsToDo;
  const mod = config.features?.home?.modules?.['things-to-do'];
  if (!t || !mod || !isListingsModule(mod)) notFound();

  const l = mod.listings.find((x) => x.slug === slug);
  if (!l) notFound();

  return (
    <MobileCanvas>
      <ListingsDetailScreen
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
          gallery: l.gallery,
        }}
        heroPrimaryAction={{ kind: 'none' }}
        texts={{
          headerTitle: t.title,
          eyebrow: t.detail.eyebrow,
          call: t.detail.call,
          website: t.detail.website,
          addFavorite: t.detail.addFavorite,
          removeFavorite: t.detail.removeFavorite,
          seeDirections: t.detail.seeDirections,
          description: t.detail.description,
          openNowUntil: t.detail.openNowUntil,
          moreHours: t.detail.moreHours,
          businessHours: t.businessHours,
        }}
        basePath="/pwa/things-to-do"
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
