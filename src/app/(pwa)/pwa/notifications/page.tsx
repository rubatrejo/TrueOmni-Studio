import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { NotificationsScreenLive } from '@/components/pwa/notifications-screen-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Notifications — lista. Abierta desde la campana del Dashboard. Textos + seed desde
 * `config.features.pwa.notifications`; el estado read/deleted vive client-side.
 * La interpolación de `{client_name}` la hace el wrapper live (preview del Studio).
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

  return (
    <MobileCanvas>
      <NotificationsScreenLive cfg={n} clientName={config.client?.nombre ?? ''} />
    </MobileCanvas>
  );
}
