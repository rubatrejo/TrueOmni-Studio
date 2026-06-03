import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { HuntDetail } from '@/components/pwa/scavenger-hunt/hunt-detail';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function PwaHuntDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getConfig();
  const sh = config.features?.pwa?.scavengerHunt;
  const hunt = sh?.hunts.find((h) => h.slug === slug);
  const mapboxToken = config.integraciones?.mapbox_token ?? '';

  if (!sh || !hunt) {
    return (
      <MobileCanvas>
        <div className="flex h-full items-center justify-center text-gray-400">Hunt not found</div>
      </MobileCanvas>
    );
  }

  return (
    <MobileCanvas>
      <HuntDetail hunt={hunt} config={sh} mapboxToken={mapboxToken} />
    </MobileCanvas>
  );
}
