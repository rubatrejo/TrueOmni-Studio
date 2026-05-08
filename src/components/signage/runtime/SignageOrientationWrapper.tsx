'use client';

import type { ReactNode } from 'react';

import { useSignageBridgeStore } from './signage-bridge-store';

/**
 * Wrapper client del runtime signage que aplica la orientación
 * (`flex-col` vs `flex-col-reverse`) reactivamente desde el bridge.
 *
 * El `<SignageRuntime>` es server por necesidad (computa `initialClock`
 * con la timezone del cliente sin conflicto de hidratación). Este
 * wrapper sustituye al `<div className="flex flex-col ...">` plano y
 * suscribe a `clientPatch.header.position` para que el editor del
 * Studio mueva el header al `bottom` en vivo sin reload.
 *
 * `serverPosition` es el fallback cuando el iframe se ve standalone
 * (sin parent editor) — primer paint en SSR sin patch del bridge.
 */
export interface SignageOrientationWrapperProps {
  serverPosition: 'top' | 'bottom';
  children: ReactNode;
}

export function SignageOrientationWrapper({
  serverPosition,
  children,
}: SignageOrientationWrapperProps) {
  const clientPatch = useSignageBridgeStore((s) => s.clientPatch);
  const position = clientPatch?.header?.position ?? serverPosition;
  const orientationClass =
    position === 'bottom' ? 'flex-col-reverse' : 'flex-col';
  return (
    <div
      className={`relative flex h-full w-full ${orientationClass} bg-signage-surface`}
    >
      {children}
    </div>
  );
}
