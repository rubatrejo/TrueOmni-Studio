import { notFound } from 'next/navigation';

import { ListingsDetailScreen } from '@/components/pwa/listings-detail-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';
import { buildPwaListingDetail } from '@/lib/pwa-listing-detail';

export const dynamic = 'force-dynamic';

/**
 * Map — detalle de un listing agregado (`/pwa/map/[module]/[slug]`). Reutiliza la
 * pantalla de detalle de listings con `basePath`/`backHref` = "/pwa/map" para que el
 * back vuelva al mapa. El armado por módulo vive en `buildPwaListingDetail`.
 */
export default async function PwaMapDetailPage({
  params,
}: {
  params: Promise<{ module: string; slug: string }>;
}) {
  const { module: moduleSlug, slug } = await params;
  const config = await getConfig();
  const data = buildPwaListingDetail(config, moduleSlug, slug);
  if (!data) notFound();

  return (
    <MobileCanvas>
      <ListingsDetailScreen
        detail={data.detail}
        texts={data.texts}
        heroPrimaryAction={data.heroPrimaryAction}
        basePath="/pwa/map"
        backHref="/pwa/map"
        navActive="map"
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
