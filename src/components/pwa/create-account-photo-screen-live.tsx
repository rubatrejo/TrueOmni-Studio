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
  // Fondo resuelto por el bridge (login → welcome → server), igual que Login —
  // en el preview del Studio (iframe KIOSK_CLIENT=default) el override del
  // cliente llega por bridge; sin esto quedaba el placeholder del default.
  const liveLogin = usePwaSection('login', undefined);
  const liveWelcome = usePwaSection('welcome', undefined);
  const background = liveLogin?.background ?? liveWelcome?.background ?? data.background;
  return (
    <CreateAccountPhotoScreen
      {...data}
      background={background}
      texts={cfg ? cfg.photo : data.texts}
    />
  );
}
