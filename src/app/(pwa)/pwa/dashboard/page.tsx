import { DashboardScreen } from '@/components/pwa/dashboard-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Home/Dashboard de la PWA (`/pwa/dashboard`). Destino del Login/Skip.
 * El contenido (hero, quick-access, tiles) viene de `config.features.pwa.dashboard`.
 */
export default async function PwaDashboardPage() {
  const config = await getConfig();
  const d = config.features?.pwa?.dashboard;

  if (!d) {
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
      <DashboardScreen
        logoAlt={config.branding.logo.alt}
        heroTitle={d.heroTitle}
        heroImage={d.heroImage}
        quickAccess={d.quickAccess}
        tiles={d.tiles}
      />
    </MobileCanvas>
  );
}
