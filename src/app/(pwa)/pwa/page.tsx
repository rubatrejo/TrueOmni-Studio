import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { WelcomeSplashLive } from '@/components/pwa/welcome-splash-live';
import { getConfig } from '@/lib/config';
import { resolvePwaConfigImages } from '@/lib/pwa-image-inheritance';

// La PWA lee config en runtime (KIOSK_CLIENT). Igual que el kiosk, marcamos la
// ruta como dinámica para que Next no intente prerenderla sin cliente válido.
export const dynamic = 'force-dynamic';

/**
 * Pantalla de arranque de la PWA (`/pwa`): Welcome splash.
 * Auto-avanza a `/pwa/login` tras `autoAdvanceMs`.
 */
export default async function PwaHomePage() {
  const config = await getConfig();
  // Fondo heredado LIVE del idle del kiosk (`features.billboard_background`)
  // cuando welcome.background está vacío. Ver `resolvePwaConfigImages`.
  const welcome = resolvePwaConfigImages(config)?.welcome;

  return (
    <MobileCanvas immersive>
      <WelcomeSplashLive welcome={welcome} logoAlt={config.branding.logo.alt} />
    </MobileCanvas>
  );
}
