import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { MoreScreen } from '@/components/pwa/more-screen';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  searchPlaceholder: 'Search',
  weatherText: '',
  items: [],
};

/** More Menu de la PWA (`/pwa/more`). Contenido desde `config.features.pwa.more`. */
export default async function PwaMorePage() {
  const config = await getConfig();
  const more = config.features?.pwa?.more ?? FALLBACK;

  return (
    <MobileCanvas>
      <MoreScreen
        searchPlaceholder={more.searchPlaceholder}
        weatherText={more.weatherText}
        items={more.items}
      />
    </MobileCanvas>
  );
}
