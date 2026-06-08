import { BrochuresListScreenLive } from '@/components/pwa/brochures-list-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Digital Brochure — listado (`/pwa/digital-brochure`). Réplica mobile del listado
 * del kiosk. Textos desde `config.features.pwa.digitalBrochure`; la data (hero,
 * categorías, brochures) se reutiliza del kiosk (`home.modules['digital-brochure']`).
 * Fallback si falta config/módulo, como el resto de módulos PWA.
 */
export default async function PwaDigitalBrochurePage() {
  const config = await getConfig();
  const texts = config.features?.pwa?.digitalBrochure;
  const mod = config.features?.home?.modules?.['digital-brochure'];

  if (!texts || !mod || mod.kind !== 'digital-brochure') {
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
      <BrochuresListScreenLive
        config={texts}
        categories={mod.categories}
        brochures={mod.brochures}
      />
    </MobileCanvas>
  );
}
