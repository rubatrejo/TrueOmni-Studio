import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { NotificationsScreen } from '@/components/pwa/notifications-screen';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Notifications — lista. Abierta desde la campana del Dashboard. Textos + seed desde
 * `config.features.pwa.notifications`; el estado read/deleted vive client-side.
 * Los títulos/cuerpos admiten `{client_name}`, interpolado aquí.
 */
export default async function PwaNotificationsPage() {
  const config = await getConfig();
  const n = config.features?.pwa?.notifications;

  if (!n) {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  const clientName = config.client?.nombre ?? '';
  const seed = n.seed.map((item) => ({
    ...item,
    title: item.title.replace(/\{client_name\}/g, clientName),
    body: item.body.replace(/\{client_name\}/g, clientName),
  }));

  return (
    <MobileCanvas>
      <NotificationsScreen cfg={n} seed={seed} />
    </MobileCanvas>
  );
}
