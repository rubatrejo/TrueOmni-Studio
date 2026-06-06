import { ListingsGridScreenLive } from '@/components/pwa/listings-grid-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Things to Do — grid de categorías (#1). Entry point del módulo (tile "THINGS TO DO"
 * del Dashboard). Textos + tiles desde `config.features.pwa.thingsToDo`; la data de
 * los lugares se reutiliza del kiosk (`home.modules['things-to-do']`).
 */
export default async function PwaThingsToDoPage() {
  const config = await getConfig();
  const t = config.features?.pwa?.thingsToDo;

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
      <ListingsGridScreenLive moduleKey="thingsToDo" config={t} basePath="/pwa/things-to-do" />
    </MobileCanvas>
  );
}
