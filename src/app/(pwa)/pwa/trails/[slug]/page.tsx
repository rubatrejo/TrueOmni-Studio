import { notFound } from 'next/navigation';

import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { TrailsDetailScreenLive } from '@/components/pwa/trails-detail-screen-live';
import { getConfig } from '@/lib/config';
import { buildPwaListingDetail } from '@/lib/pwa-listing-detail';

export const dynamic = 'force-dynamic';

/**
 * Trails — detalle (#4–#7). Reutiliza `ListingsDetailScreen` con el panel
 * Considerations + el mapa de 2 tabs (mapa normal / ruta GeoJSON), armados en
 * `buildPwaListingDetail` (rama 'trails'). Sin acción de hero ni horario.
 */
export default async function PwaTrailDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getConfig();
  const t = config.features?.pwa?.trails;
  const data = buildPwaListingDetail(config, 'trails', slug);
  if (!t || !data) notFound();

  return (
    <MobileCanvas>
      <TrailsDetailScreenLive
        config={t}
        detail={data.detail}
        texts={data.texts}
        heroPrimaryAction={data.heroPrimaryAction}
        considerations={data.considerations}
        trailMap={data.trailMap}
        basePath="/pwa/trails"
        backHref="/pwa/trails/list"
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
