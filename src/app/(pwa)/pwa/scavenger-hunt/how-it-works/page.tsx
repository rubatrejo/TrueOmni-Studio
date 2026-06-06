import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { HuntHowItWorksLive } from '@/components/pwa/scavenger-hunt/hunt-how-it-works-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function PwaHowItWorksPage() {
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
      <HuntHowItWorksLive config={sh} />
    </MobileCanvas>
  );
}
