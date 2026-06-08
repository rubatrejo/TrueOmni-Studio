'use client';

import type { ComponentProps } from 'react';

import type { PwaCreateAccountConfig } from '@/lib/config';

import { CreateAccountPhotoScreen } from './create-account-photo-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live de los pasos 2-4 de Create Account (subir foto). Si hay override de
 * `features.pwa.createAccount` usa su bloque `photo`; si no, usa el del server. El
 * fondo, el nombre y el href vienen del server. No toca `CreateAccountPhotoScreen`.
 */
export function CreateAccountPhotoScreenLive({
  config,
  ...data
}: ComponentProps<typeof CreateAccountPhotoScreen> & {
  config?: PwaCreateAccountConfig;
}) {
  const cfg = usePwaSection('createAccount', config);
  return <CreateAccountPhotoScreen {...data} texts={cfg ? cfg.photo : data.texts} />;
}
