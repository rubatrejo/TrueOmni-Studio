import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { MoreScreenLive } from '@/components/pwa/more-screen-live';
import { getClientSlug } from '@/lib/client-env';
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
  // El Survey reusa el contenido del kiosk (`features.home.survey`) y se abre como
  // popup desde el item "survey" del More (no navega a una ruta).
  const survey = config.features?.home?.survey;

  return (
    <MobileCanvas>
      <MoreScreenLive more={more} survey={survey} clientSlug={getClientSlug()} />
    </MobileCanvas>
  );
}
