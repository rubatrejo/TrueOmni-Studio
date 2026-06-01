import { notFound } from 'next/navigation';

import { ListingsDetailScreen } from '@/components/pwa/listings-detail-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';
import { buildPwaListingDetail } from '@/lib/pwa-listing-detail';

export const dynamic = 'force-dynamic';

/**
 * Events — detalle de un evento (`/pwa/events/[slug]`). Reutiliza la pantalla de
 * detalle de listings con una fila de fecha/hora (`eventWhen`) y el botón GET
 * TICKETS; el armado vive en `buildPwaListingDetail` (rama events). El back
 * vuelve a la timeline (`/pwa/events`).
 */
export default async function PwaEventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getConfig();
  const data = buildPwaListingDetail(config, 'events', slug);
  if (!data) notFound();

  return (
    <MobileCanvas>
      <ListingsDetailScreen
        detail={data.detail}
        texts={data.texts}
        heroPrimaryAction={data.heroPrimaryAction}
        basePath="/pwa/events"
        backHref="/pwa/events"
        navActive="events"
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
