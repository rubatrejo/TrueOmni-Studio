import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { PassesGridScreenLive } from '@/components/pwa/passes-grid-screen-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Passes — grid de passes (#1). Entry point del módulo (tile "PASSES" del
 * Dashboard). Título desde `config.features.pwa.passes`; los passes se reutilizan
 * del kiosk (`home.modules.passes`).
 */
export default async function PwaPassesPage() {
  const config = await getConfig();
  const texts = config.features?.pwa?.passes;
  const mod = config.features?.home?.modules?.passes;

  if (!texts || !mod || mod.kind !== 'passes') {
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
      <PassesGridScreenLive config={texts} passes={mod.passes} />
    </MobileCanvas>
  );
}
