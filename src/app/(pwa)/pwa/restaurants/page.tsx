import { ListingsGridScreenLive } from '@/components/pwa/listings-grid-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';
import { buildSubcategoryTiles } from '@/lib/pwa-subcategory-tiles';

export const dynamic = 'force-dynamic';

/**
 * Restaurants — grid de subcategorías (#1). Entry point del módulo (tile del Dashboard
 * y nav "dining"). Textos + tiles desde `config.features.pwa.restaurants`.
 */
export default async function PwaRestaurantsPage() {
  const config = await getConfig();
  const r = config.features?.pwa?.restaurants;
  const subcategoryTiles = buildSubcategoryTiles(config.features?.home?.modules?.restaurants);

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
      <ListingsGridScreenLive
        moduleKey="restaurants"
        config={r}
        basePath="/pwa/restaurants"
        navActive="dining"
        subcategoryTiles={subcategoryTiles}
      />
    </MobileCanvas>
  );
}
