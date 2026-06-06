'use client';

import type { PwaNotificationsConfig } from '@/lib/config';

import { NotificationsScreen } from './notifications-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live de Notifications. Lee el override de `features.pwa.notifications`
 * (preview en vivo del Studio) y cae al valor del server fuera del Studio.
 * Re-interpola `{client_name}` en el seed igual que la page del server. No toca
 * `NotificationsScreen`.
 */
export function NotificationsScreenLive({
  cfg,
  clientName,
}: {
  cfg: PwaNotificationsConfig;
  clientName: string;
}) {
  const n = usePwaSection('notifications', cfg) ?? cfg;
  const seed = n.seed.map((item) => ({
    ...item,
    title: item.title.replace(/\{client_name\}/g, clientName),
    body: item.body.replace(/\{client_name\}/g, clientName),
  }));
  return <NotificationsScreen cfg={n} seed={seed} />;
}
