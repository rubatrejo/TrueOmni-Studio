'use client';

import type { ComponentProps } from 'react';

import type { PwaConnectWithUsConfig } from '@/lib/config';

import { ConnectWithUsScreen } from './connect-with-us-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live de Connect With Us. Lee el override de `features.pwa.connectWithUs` y
 * sustituye en vivo los textos crudos (title, orgName, contacto, social, acciones,
 * dirección, título del modal de horario). Los textos interpolados en server
 * (statusText con `{close}`, copyright con `{client_name}`/`{city}`/`{year}`), el
 * schedule, las coords y el token de mapa vienen del server y se reflejan al
 * recargar. No toca `ConnectWithUsScreen`.
 */
export function ConnectWithUsScreenLive({
  config,
  ...data
}: ComponentProps<typeof ConnectWithUsScreen> & {
  config?: PwaConnectWithUsConfig;
}) {
  const cfg = usePwaSection('connectWithUs', config);
  return (
    <ConnectWithUsScreen
      {...data}
      title={cfg?.title ?? data.title}
      orgName={cfg?.orgName || data.orgName}
      social={cfg?.social ?? data.social}
      phone={cfg?.phone ?? data.phone}
      website={cfg?.website ?? data.website}
      actions={cfg?.actions ?? data.actions}
      address={cfg?.address ?? data.address}
      modalTitle={cfg?.hours?.modalTitle ?? data.modalTitle}
    />
  );
}
