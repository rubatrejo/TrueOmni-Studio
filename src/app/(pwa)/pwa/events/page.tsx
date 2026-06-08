import { EventsTimelineScreenLive } from '@/components/pwa/events-timeline-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';
import { sortEvents } from '@/lib/events-sort';

export const dynamic = 'force-dynamic';

/**
 * Events — timeline cronológica (`/pwa/events`). Pantalla primaria del bottom nav.
 * Textos desde `config.features.pwa.events`; los eventos se reutilizan del kiosk
 * (`home.modules.events`) ordenados por fecha (asc). Si falta config/módulo, cae a
 * un fallback como en el resto de módulos PWA.
 */
export default async function PwaEventsPage() {
  const config = await getConfig();
  const texts = config.features?.pwa?.events;
  const mod = config.features?.home?.modules?.events;

  if (!texts || !mod || mod.kind !== 'events') {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  const events = sortEvents(mod.events, 'date', config.client?.coords);

  return (
    <MobileCanvas>
      <EventsTimelineScreenLive config={texts} events={events} />
    </MobileCanvas>
  );
}
