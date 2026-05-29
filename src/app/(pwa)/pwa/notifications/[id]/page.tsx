import { notFound } from 'next/navigation';

import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { NotificationDetailScreen } from '@/components/pwa/notification-detail-screen';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Notifications — detalle (`/pwa/notifications/[id]`). Hero + cuerpo + ACTION TEXT.
 * Contenido desde `config.features.pwa.notifications.seed`; marca leída al montar.
 */
export default async function PwaNotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = await getConfig();
  const n = config.features?.pwa?.notifications;
  if (!n) notFound();

  const item = n.seed.find((x) => x.id === id);
  if (!item) notFound();

  const clientName = config.client?.nombre ?? '';
  const notification = {
    ...item,
    title: item.title.replace(/\{client_name\}/g, clientName),
    body: item.body.replace(/\{client_name\}/g, clientName),
  };

  return (
    <MobileCanvas>
      <NotificationDetailScreen headerTitle={n.title} notification={notification} />
    </MobileCanvas>
  );
}
