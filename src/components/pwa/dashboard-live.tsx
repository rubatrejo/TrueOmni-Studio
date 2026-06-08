'use client';

import type { PwaDashboardConfig, PwaNotification } from '@/lib/config';

import { DashboardScreen } from './dashboard-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del Dashboard. Lee el override del slice `features.pwa.dashboard`
 * que empuja el editor PWA del Studio (preview en vivo) y cae al valor del
 * server (`dashboard`) fuera del Studio — comportamiento idéntico al runtime
 * normal. No toca `DashboardScreen`.
 */
export function DashboardLive({
  logoAlt,
  dashboard,
  notifications,
}: {
  logoAlt: string;
  dashboard: PwaDashboardConfig;
  notifications: PwaNotification[];
}) {
  const d = usePwaSection('dashboard', dashboard) ?? dashboard;
  return (
    <DashboardScreen
      logoAlt={logoAlt}
      heroTitle={d.heroTitle}
      heroImage={d.heroImage}
      quickAccess={d.quickAccess}
      tiles={d.tiles}
      notifications={notifications}
      logoSize={d.logoSize}
      logoOffset={d.logoOffset}
    />
  );
}
