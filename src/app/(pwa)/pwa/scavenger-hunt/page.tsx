import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { HuntDashboardLive } from '@/components/pwa/scavenger-hunt/hunt-dashboard-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function PwaScavengerHuntPage() {
  const config = await getConfig();
  const sh = config.features?.pwa?.scavengerHunt;

  if (!sh) {
    return (
      <MobileCanvas>
        <div className="flex h-full items-center justify-center text-gray-400">
          Scavenger Hunt not configured
        </div>
      </MobileCanvas>
    );
  }

  return (
    <MobileCanvas>
      <HuntDashboardLive config={sh} />
    </MobileCanvas>
  );
}
