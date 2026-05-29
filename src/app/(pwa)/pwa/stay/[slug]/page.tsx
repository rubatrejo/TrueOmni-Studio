import { notFound } from 'next/navigation';

import { ListingsDetailScreen } from '@/components/pwa/listings-detail-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';
import { isListingsModule } from '@/lib/itinerary-tabs';

export const dynamic = 'force-dynamic';

/**
 * Places to Stay — detalle (#4–#7, #10) + popups galería (#6) y horarios (#11).
 * La data del hotel viene del kiosk (`home.modules.stay.listings`); los textos
 * desde `config.features.pwa.stay`. La acción primaria del hero es "BOOK NOW"
 * (abre `reserveUrl ?? website`).
 */
export default async function PwaStayDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getConfig();
  const s = config.features?.pwa?.stay;
  const mod = config.features?.home?.modules?.stay;
  if (!s || !mod || !isListingsModule(mod)) notFound();

  const l = mod.listings.find((x) => x.slug === slug);
  if (!l) notFound();

  const bookUrl = l.reserveUrl ?? l.website;

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
        heroPrimaryAction={
          bookUrl && s.detail.bookNow
            ? { kind: 'external-link', label: s.detail.bookNow, url: bookUrl }
            : { kind: 'none' }
        }
        texts={{
          headerTitle: s.title,
          eyebrow: s.detail.eyebrow,
          call: s.detail.call,
          website: s.detail.website,
          addFavorite: s.detail.addFavorite,
          removeFavorite: s.detail.removeFavorite,
          seeDirections: s.detail.seeDirections,
          description: s.detail.description,
          openNowUntil: s.detail.openNowUntil,
          moreHours: s.detail.moreHours,
          businessHours: s.businessHours,
        }}
        basePath="/pwa/stay"
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
