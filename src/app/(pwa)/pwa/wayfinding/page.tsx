import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { WayfindingScreen } from '@/components/pwa/wayfinding-screen';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Pantalla principal de Wayfinding (`/pwa/wayfinding`): floor plan 3D + tabs
 * de pisos + cards de amenidades + welcome modal (primera visita).
 */
export default async function PwaWayfindingPage() {
  const config = await getConfig();
  const wf = config.features?.pwa?.wayfinding;

  if (!wf) {
    return (
      <MobileCanvas>
        <div className="flex h-full items-center justify-center text-gray-400">
          Wayfinding not configured
        </div>
      </MobileCanvas>
    );
  }

  return (
    <MobileCanvas>
      <WayfindingScreen config={wf} />
    </MobileCanvas>
  );
}
