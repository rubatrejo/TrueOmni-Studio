'use client';

import type { PwaChangePasswordConfig } from '@/lib/config';

import { ChangePasswordScreen } from './change-password-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live de Change Password. Re-deriva `changePassword` desde el override
 * de `features.pwa.profile` (preview en vivo del Studio) con el valor del server
 * como fallback. No toca `ChangePasswordScreen`.
 */
export function ChangePasswordScreenLive({
  changePassword,
  doneHref,
}: {
  changePassword: PwaChangePasswordConfig;
  doneHref: string;
}) {
  const profile = usePwaSection('profile', undefined);
  const cp = profile?.changePassword ?? changePassword;
  return <ChangePasswordScreen texts={cp} doneHref={doneHref} />;
}
