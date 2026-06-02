import { ListingsGridScreen } from '@/components/pwa/listings-grid-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Trails — grid de subcategorías (#1). Entry point del módulo (tile "TRAILS" del
 * Dashboard). Textos + tiles desde `config.features.pwa.trails`; la data de los
 * trails se reutiliza del kiosk (`home.modules.trails`).
 */
export default async function PwaTrailsPage() {
  const config = await getConfig();
  const t = config.features?.pwa?.trails;

  if (!t) {
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
      <ListingsGridScreen
        searchPlaceholder={t.searchPlaceholder}
        categories={t.categories}
        basePath="/pwa/trails"
      />
    </MobileCanvas>
  );
}
