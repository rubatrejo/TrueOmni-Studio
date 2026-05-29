import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { RestaurantsGridScreen } from '@/components/pwa/restaurants-grid-screen';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Restaurants — grid de subcategorías (#1). Entry point del módulo (tile del Dashboard
 * y nav "dining"). Textos + tiles desde `config.features.pwa.restaurants`.
 */
export default async function PwaRestaurantsPage() {
  const config = await getConfig();
  const r = config.features?.pwa?.restaurants;

  if (!r) {
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
      <RestaurantsGridScreen searchPlaceholder={r.searchPlaceholder} categories={r.categories} />
    </MobileCanvas>
  );
}
