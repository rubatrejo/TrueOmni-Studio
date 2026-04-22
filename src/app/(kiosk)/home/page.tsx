import { AdsSlot } from '@/components/ads/ads-slot';
import { HomeHeader } from '@/components/home/header';
import { HomeShell } from '@/components/home/home-shell';
import { SurveyHost } from '@/components/home/survey-host';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { getAdsFromConfig } from '@/lib/ads';
import { getConfig, type HomeTile } from '@/lib/config';

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
  const tiles: HomeTile[] = home.tiles.filter((t) => t.enabled);
  if (home.wayfinding?.enabled) {
    tiles.push({
      key: 'wayfinding',
      label: home.wayfinding.label,
      enabled: true,
      image: home.wayfinding.image,
    });
  }
  return (
    <KioskCanvas>
      <HomeShell
        header={<HomeHeader />}
        listings={home.listings}
        tiles={tiles}
        survey={home.survey}
      />
      <AdsSlot ads={ads} />
      <SurveyHost
        survey={home.survey}
        client={{ slug: config.client.slug }}
        textos={config.textos}
      />
    </KioskCanvas>
  );
}
