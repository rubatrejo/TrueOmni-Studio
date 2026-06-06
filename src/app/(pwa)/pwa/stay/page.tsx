import { ListingsGridScreenLive } from '@/components/pwa/listings-grid-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Places to Stay — grid de categorías (#1). Entry point del módulo (quick-access
 * "PLACES TO STAY" del Dashboard). Textos + tiles desde `config.features.pwa.stay`;
 * la data de los hoteles se reutiliza del kiosk (`home.modules.stay`).
 */
export default async function PwaStayPage() {
  const config = await getConfig();
  const s = config.features?.pwa?.stay;

  if (!s) {
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
      <ListingsGridScreenLive moduleKey="stay" config={s} basePath="/pwa/stay" />
    </MobileCanvas>
  );
}
