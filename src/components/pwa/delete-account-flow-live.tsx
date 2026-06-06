'use client';

import type { PwaDeleteFlowConfig } from '@/lib/config';

import { DeleteAccountFlow } from './delete-account-flow';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del flujo Delete Account. Re-deriva `delete` desde el override de
 * `features.pwa.profile` (preview en vivo del Studio) con el valor del server
 * como fallback. No toca `DeleteAccountFlow`.
 */
export function DeleteAccountFlowLive({
  deleteFlow,
  logoutHref,
}: {
  deleteFlow: PwaDeleteFlowConfig;
  logoutHref: string;
}) {
  const profile = usePwaSection('profile', undefined);
  const d = profile?.delete ?? deleteFlow;
  return <DeleteAccountFlow texts={d} logoutHref={logoutHref} />;
}
