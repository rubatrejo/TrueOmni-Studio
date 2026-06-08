import { notFound } from 'next/navigation';

import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { TicketsDetailScreenLive } from '@/components/pwa/tickets-detail-screen-live';
import { getConfig } from '@/lib/config';
import { buildPwaListingDetail } from '@/lib/pwa-listing-detail';

export const dynamic = 'force-dynamic';

/**
 * Tickets — detalle de un ticket (`/pwa/tickets/[slug]`). Reutiliza la pantalla de
 * detalle de Events (fila de fecha/hora) con el CTA "BUY TICKET · {precio}" que abre
 * `ticket.purchaseUrl`; el armado vive en `buildPwaListingDetail` (rama tickets). El
 * back vuelve a la timeline (`/pwa/tickets`). Bottom nav sin celda activa.
 */
export default async function PwaTicketDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getConfig();
  const texts = config.features?.pwa?.tickets;
  const data = buildPwaListingDetail(config, 'tickets', slug);
  if (!texts || !data) notFound();

  return (
    <MobileCanvas>
      <TicketsDetailScreenLive
        config={texts}
        detail={data.detail}
        texts={data.texts}
        heroPrimaryAction={data.heroPrimaryAction}
        basePath="/pwa/tickets"
        backHref="/pwa/tickets"
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
