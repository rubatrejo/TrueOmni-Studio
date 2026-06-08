'use client';

import type { ComponentProps } from 'react';

import type { PwaNotificationsConfig } from '@/lib/config';

import { NotificationDetailScreen } from './notification-detail-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del detalle de notificación. Lee el override de
 * `features.pwa.notifications` y sustituye en vivo el título del header; la
 * notificación (con `{client_name}` interpolado en server) viene del server. No
 * toca `NotificationDetailScreen`.
 */
export function NotificationDetailScreenLive({
  cfg,
  ...data
}: ComponentProps<typeof NotificationDetailScreen> & {
  cfg: PwaNotificationsConfig;
}) {
  const n = usePwaSection('notifications', cfg) ?? cfg;
  return <NotificationDetailScreen {...data} headerTitle={n.title} />;
}
