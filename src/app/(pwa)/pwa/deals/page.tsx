import { DealsGridScreenLive } from '@/components/pwa/deals-grid-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Deals — grid de cupones (`/pwa/deals`). Entry point desde el tile "DEALS" del
 * Dashboard y el item "Deals" del More. Textos desde `config.features.pwa.deals`;
 * los cupones se reutilizan del kiosk (`home.modules.deals`).
 */
export default async function PwaDealsPage() {
  const config = await getConfig();
  const texts = config.features?.pwa?.deals;
  const mod = config.features?.home?.modules?.deals;

  if (!texts || !mod || mod.kind !== 'deals') {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  return (
    <MobileCanvas>
      <DealsGridScreenLive config={texts} deals={mod.deals} featureCatalog={mod.featureCatalog} />
    </MobileCanvas>
  );
}
