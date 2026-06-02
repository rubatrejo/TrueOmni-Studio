import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { TicketsScreen } from '@/components/pwa/tickets-screen';
import { getConfig } from '@/lib/config';
import { filterTicketableEvents } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

/**
 * Tickets — timeline por día (`/pwa/tickets`). Entry point desde el tile "TICKETS"
 * del Dashboard y el item "Tickets" del More. Tickets ⊂ Events: la data son los
 * `EventItem` con campo `ticket` (`filterTicketableEvents`). Textos desde
 * `config.features.pwa.tickets`.
 */
export default async function PwaTicketsPage() {
  const config = await getConfig();
  const texts = config.features?.pwa?.tickets;
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

  const tickets = filterTicketableEvents(mod.events);

  return (
    <MobileCanvas>
      <TicketsScreen texts={texts} tickets={tickets} />
    </MobileCanvas>
  );
}
