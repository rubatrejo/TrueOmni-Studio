import { AdsSlot } from '@/components/ads/ads-slot';
import { CategoryGrid } from '@/components/home/category-grid';
import { HomeHeader } from '@/components/home/header';
import { HomeShell } from '@/components/home/home-shell';
import { WayfindingBanner } from '@/components/home/wayfinding-banner';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { getAdsFromConfig } from '@/lib/ads';
import { getConfig } from '@/lib/config';

export default async function HomePage() {
  const config = await getConfig();
  const home = config.features?.home;
  if (!home) {
    return (
      <KioskCanvas>
        <div className="p-12 text-center text-xl font-semibold text-gray-700">
          El cliente activo no tiene configurado `features.home`.
        </div>
      </KioskCanvas>
    );
  }
  const ads = getAdsFromConfig(config);
  return (
    <KioskCanvas>
      <HomeShell header={<HomeHeader />} listings={home.listings}>
        <CategoryGrid tiles={home.tiles.filter((t) => t.enabled)} />
        {home.wayfinding?.enabled ? <WayfindingBanner wayfinding={home.wayfinding} /> : null}
      </HomeShell>
      <AdsSlot ads={ads} />
    </KioskCanvas>
  );
}
