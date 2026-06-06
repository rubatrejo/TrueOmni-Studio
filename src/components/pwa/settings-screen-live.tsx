'use client';

import type { PwaSettingsConfig } from '@/lib/config';

import { usePwaSection } from './pwa-bridge-context';
import { SettingsScreen } from './settings-screen';

/**
 * Wrapper live de Settings. Re-deriva `settings` desde el override de
 * `features.pwa.profile` (preview en vivo del Studio) con el valor del server
 * como fallback. No toca `SettingsScreen`.
 */
export function SettingsScreenLive({ settings }: { settings: PwaSettingsConfig }) {
  const profile = usePwaSection('profile', undefined);
  const s = profile?.settings ?? settings;
  return <SettingsScreen title={s.title} deleteRow={s.deleteRow} />;
}
