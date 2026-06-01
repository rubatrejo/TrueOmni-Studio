import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { PwaMapScreen } from '@/components/pwa/pwa-map-screen';
import { getConfig } from '@/lib/config';
import { getPwaMapData } from '@/lib/pwa-map-listings';

export const dynamic = 'force-dynamic';

/**
 * Map — list+map agregado (`/pwa/map`). Entry point desde la celda "map" del bottom
 * nav y el tile "MAP" del Dashboard. Textos desde `config.features.pwa.map`; los
 * listings se reutilizan del kiosk (`home.modules.<source>`) vía `getPwaMapData`.
 */
export default async function PwaMapPage() {
  const config = await getConfig();
  const m = config.features?.pwa?.map;

  if (!m) {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  const { items, mapItems, listings, features } = getPwaMapData(config);

  return (
    <MobileCanvas>
      <PwaMapScreen
        title={m.title}
        tabs={m.tabs}
        resultsLabel={m.resultsLabel}
        distanceSuffix={m.distanceSuffix}
        allLabel={m.allLabel}
        categories={m.categories}
        items={items}
        mapItems={mapItems}
        listings={listings}
        features={features}
        filterTexts={m.filters}
        origin={config.client?.coords}
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
